import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FacebookAdapter } from './facebook.js';
import { LinkedInAdapter } from './linkedin.js';
import { TwitterAdapter } from './twitter.js';

type FetchResponseShape = {
  ok: boolean;
  status?: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
  headers?: Record<string, string>;
};

function makeResponse(payload: FetchResponseShape) {
  return {
    ok: payload.ok,
    status: payload.status ?? (payload.ok ? 200 : 500),
    json: payload.json ?? (async () => ({})),
    text: payload.text ?? (async () => ''),
    headers: { get: (k: string) => payload.headers?.[k] ?? null },
  } as unknown as Response;
}

function pngBytes(): { bytes: Buffer; contentType: string } {
  return { bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]), contentType: 'image/png' };
}

describe('FacebookAdapter image publishing', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hits /photos with url+caption when mediaUrls provided', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        ok: true,
        json: async () => ({ data: [{ id: 'page-1', access_token: 'page-token' }] }),
      }),
    );
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, json: async () => ({ id: 'photo-1', post_id: 'wall-1' }) }),
    );

    const adapter = new FacebookAdapter();
    const result = await adapter.publishPost({
      content: 'Hello',
      accessToken: 'user-token',
      mediaUrls: ['https://example.com/cat.png'],
    });

    expect(result.platformPostId).toBe('wall-1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1] as [string, { body: string }];
    expect(url).toContain('/page-1/photos');
    const body = JSON.parse(init.body);
    expect(body.url).toBe('https://example.com/cat.png');
    expect(body.caption).toBe('Hello');
  });

  it('falls back to /feed when no media is attached', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        ok: true,
        json: async () => ({ data: [{ id: 'page-1', access_token: 'page-token' }] }),
      }),
    );
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, json: async () => ({ id: 'wall-2' }) }),
    );

    const adapter = new FacebookAdapter();
    await adapter.publishPost({ content: 'Plain', accessToken: 'user-token' });

    const [url, init] = fetchMock.mock.calls[1] as [string, { body: string }];
    expect(url).toContain('/page-1/feed');
    expect(JSON.parse(init.body)).toEqual({ message: 'Plain', access_token: 'page-token' });
  });
});

describe('LinkedInAdapter image publishing', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers, uploads, then attaches the asset to the ugcPost', async () => {
    // 1. /v2/userinfo
    fetchMock.mockResolvedValueOnce(makeResponse({ ok: true, json: async () => ({ sub: 'me-123' }) }));
    // 2. /v2/assets?action=registerUpload
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        ok: true,
        json: async () => ({
          value: {
            asset: 'urn:li:digitalmediaAsset:asset-xyz',
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: 'https://upload.linkedin.example/asset-xyz',
              },
            },
          },
        }),
      }),
    );
    // 3. PUT bytes
    fetchMock.mockResolvedValueOnce(makeResponse({ ok: true }));
    // 4. /v2/ugcPosts
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, json: async () => ({ id: 'urn:li:share:share-1' }) }),
    );

    const adapter = new LinkedInAdapter();
    const result = await adapter.publishPost({
      content: 'Hi',
      accessToken: 'tok',
      mediaFiles: [pngBytes()],
    });

    expect(result.platformPostId).toBe('urn:li:share:share-1');
    expect(fetchMock).toHaveBeenCalledTimes(4);

    const ugcCall = fetchMock.mock.calls[3] as [string, { body: string }];
    const ugcBody = JSON.parse(ugcCall[1].body);
    expect(ugcBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory).toBe('IMAGE');
    expect(ugcBody.specificContent['com.linkedin.ugc.ShareContent'].media).toEqual([
      { status: 'READY', media: 'urn:li:digitalmediaAsset:asset-xyz' },
    ]);
  });

  it('uses shareMediaCategory: NONE when no mediaFiles are passed', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse({ ok: true, json: async () => ({ sub: 'me-123' }) }));
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, json: async () => ({ id: 'urn:li:share:share-2' }) }),
    );

    const adapter = new LinkedInAdapter();
    await adapter.publishPost({ content: 'Plain', accessToken: 'tok' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const ugcCall = fetchMock.mock.calls[1] as [string, { body: string }];
    const ugcBody = JSON.parse(ugcCall[1].body);
    expect(ugcBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory).toBe('NONE');
    expect(ugcBody.specificContent['com.linkedin.ugc.ShareContent'].media).toBeUndefined();
  });
});

describe('TwitterAdapter image publishing', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uploads media then attaches media_ids to /2/tweets', async () => {
    // 1. /2/media/upload
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, json: async () => ({ data: { id: 'media-1' } }) }),
    );
    // 2. /2/tweets
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, json: async () => ({ data: { id: 'tweet-1' } }) }),
    );

    const adapter = new TwitterAdapter();
    await adapter.publishPost({
      content: 'tweet with image',
      accessToken: 'tok',
      mediaFiles: [pngBytes()],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [uploadUrl, uploadInit] = fetchMock.mock.calls[0] as [string, { method: string; body: FormData }];
    expect(uploadUrl).toBe('https://api.twitter.com/2/media/upload');
    expect(uploadInit.method).toBe('POST');
    expect(uploadInit.body).toBeInstanceOf(FormData);

    const [tweetUrl, tweetInit] = fetchMock.mock.calls[1] as [string, { body: string }];
    expect(tweetUrl).toBe('https://api.twitter.com/2/tweets');
    const tweetBody = JSON.parse(tweetInit.body);
    expect(tweetBody.media).toEqual({ media_ids: ['media-1'] });
  });

  it('omits media field when no files are attached', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ ok: true, json: async () => ({ data: { id: 'tweet-2' } }) }),
    );

    const adapter = new TwitterAdapter();
    await adapter.publishPost({ content: 'plain tweet', accessToken: 'tok' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, tweetInit] = fetchMock.mock.calls[0] as [string, { body: string }];
    const tweetBody = JSON.parse(tweetInit.body);
    expect(tweetBody.media).toBeUndefined();
    expect(tweetBody.text).toBe('plain tweet');
  });
});
