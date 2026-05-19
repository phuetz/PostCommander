import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TwitterAdapter } from './twitter.js';
import { LinkedInAdapter } from './linkedin.js';
import { FacebookAdapter } from './facebook.js';
import { InstagramAdapter } from './instagram.js';
import { PinterestAdapter } from './pinterest.js';
import { TikTokAdapter } from './tiktok.js';
import { NotImplementedError } from './base-platform.js';

describe('Platform analytics dispatch', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('TwitterAdapter.fetchAnalytics', () => {
    it('maps public_metrics fields to PlatformMetrics', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            public_metrics: {
              impression_count: 4200,
              like_count: 73,
              retweet_count: 5,
              quote_count: 2,
              reply_count: 11,
            },
          },
        }),
      });

      const adapter = new TwitterAdapter();
      const metrics = await adapter.fetchAnalytics('token', '1234567890');

      expect(metrics).toEqual({
        views: 4200,
        likes: 73,
        shares: 7, // retweet + quote
        commentsCount: 11,
      });

      const callArgs = (globalThis.fetch as any).mock.calls[0];
      expect(callArgs[0]).toContain('https://api.twitter.com/2/tweets/1234567890');
      expect(callArgs[0]).toContain('tweet.fields=public_metrics');
      expect(callArgs[1].headers.Authorization).toBe('Bearer token');
    });

    it('defaults missing fields to 0', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { public_metrics: {} } }),
      });

      const metrics = await new TwitterAdapter().fetchAnalytics('t', 'id');
      expect(metrics).toEqual({ views: 0, likes: 0, shares: 0, commentsCount: 0 });
    });

    it('throws on non-2xx response', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'unauthorized',
      });

      await expect(new TwitterAdapter().fetchAnalytics('bad', 'id')).rejects.toThrow(
        /Twitter analytics fetch failed.*401/,
      );
    });

    it('URL-encodes platformPostId to prevent path injection', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { public_metrics: {} } }),
      });

      await new TwitterAdapter().fetchAnalytics('t', '../admin');

      const url = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(url).toContain('..%2Fadmin');
      expect(url).not.toContain('/../admin');
    });
  });

  describe('Base adapter default', () => {
    it('TikTok still throws NotImplementedError (API gated for business accounts)', async () => {
      const tiktok = new TikTokAdapter();
      await expect(tiktok.fetchAnalytics('t', 'id')).rejects.toBeInstanceOf(NotImplementedError);
    });

    it('NotImplementedError carries the platform id and method name', async () => {
      try {
        await new TikTokAdapter().fetchAnalytics('t', 'id');
        expect.fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(NotImplementedError);
        expect((err as Error).message).toContain('tiktok');
        expect((err as Error).message).toContain('fetchAnalytics');
      }
    });
  });

  describe('FacebookAdapter.fetchAnalytics', () => {
    it('reads summary.total_count for likes/comments and shares.count', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          likes: { summary: { total_count: 88 } },
          comments: { summary: { total_count: 12 } },
          shares: { count: 5 },
        }),
      });

      const metrics = await new FacebookAdapter().fetchAnalytics('tok', '123_456');

      expect(metrics).toEqual({ views: 0, likes: 88, shares: 5, commentsCount: 12 });
      const url = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(url).toContain('graph.facebook.com/v19.0/123_456');
      expect(url).toContain('fields=likes.summary(true),comments.summary(true),shares');
      expect(url).toContain('access_token=tok');
    });

    it('defaults missing summaries to 0', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      const m = await new FacebookAdapter().fetchAnalytics('t', 'id');
      expect(m).toEqual({ views: 0, likes: 0, shares: 0, commentsCount: 0 });
    });

    it('throws on non-2xx response', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'invalid token',
      });
      await expect(new FacebookAdapter().fetchAnalytics('bad', 'id')).rejects.toThrow(
        /Facebook analytics fetch failed.*400/,
      );
    });
  });

  describe('InstagramAdapter.fetchAnalytics', () => {
    it('aggregates insights metric data array into PlatformMetrics', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { name: 'impressions', values: [{ value: 5400 }] },
            { name: 'likes', values: [{ value: 230 }] },
            { name: 'comments', values: [{ value: 17 }] },
            { name: 'shares', values: [{ value: 9 }] },
          ],
        }),
      });

      const m = await new InstagramAdapter().fetchAnalytics('tok', '17841400000');
      expect(m).toEqual({ views: 5400, likes: 230, shares: 9, commentsCount: 17 });
    });

    it('ignores extra unknown metrics and defaults missing ones to 0', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { name: 'likes', values: [{ value: 10 }] },
            { name: 'reach', values: [{ value: 999 }] }, // unknown — ignored
          ],
        }),
      });
      const m = await new InstagramAdapter().fetchAnalytics('t', 'id');
      expect(m).toEqual({ views: 0, likes: 10, shares: 0, commentsCount: 0 });
    });

    it('surfaces 400 from non-business accounts as a regular fetch error', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'must be a business account',
      });
      await expect(new InstagramAdapter().fetchAnalytics('t', 'id')).rejects.toThrow(
        /Instagram analytics fetch failed.*400/,
      );
    });
  });

  describe('PinterestAdapter.fetchAnalytics', () => {
    it('maps v5 summary_metrics to PlatformMetrics (SAVE→shares, REACTION→likes)', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          all: {
            summary_metrics: {
              IMPRESSION: 12_345,
              SAVE: 89,
              PIN_CLICK: 41,
              REACTION: 154,
            },
          },
        }),
      });

      const m = await new PinterestAdapter().fetchAnalytics('tok', 'pin_abc');
      expect(m).toEqual({ views: 12_345, likes: 154, shares: 89, commentsCount: 0 });

      const url = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(url).toContain('api.pinterest.com/v5/pins/pin_abc/analytics');
      expect(url).toContain('metric_types=IMPRESSION,SAVE,PIN_CLICK,REACTION');
      expect(url).toMatch(/start_date=\d{4}-\d{2}-\d{2}/);
      expect(url).toMatch(/end_date=\d{4}-\d{2}-\d{2}/);
    });

    it('defaults all metrics to 0 when summary_metrics is missing', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      const m = await new PinterestAdapter().fetchAnalytics('t', 'id');
      expect(m).toEqual({ views: 0, likes: 0, shares: 0, commentsCount: 0 });
    });

    it('throws on 401 (expired token)', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'token expired',
      });
      await expect(new PinterestAdapter().fetchAnalytics('expired', 'id')).rejects.toThrow(
        /Pinterest analytics fetch failed.*401/,
      );
    });
  });

  describe('LinkedInAdapter.fetchAnalytics', () => {
    it('aggregates likes + comments counts from socialActions paging.total', async () => {
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ paging: { total: 42 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ paging: { total: 7 } }),
        });

      const metrics = await new LinkedInAdapter().fetchAnalytics(
        'token',
        'urn:li:ugcPost:7156789',
      );

      expect(metrics).toEqual({
        views: 0, // Marketing API scope required
        likes: 42,
        shares: 0, // not exposed in public API
        commentsCount: 7,
      });

      const calls = (globalThis.fetch as any).mock.calls;
      // URN colons must be URL-encoded
      expect(calls[0][0]).toContain('urn%3Ali%3AugcPost%3A7156789');
      expect(calls[0][0]).toContain('/likes');
      expect(calls[1][0]).toContain('/comments');
      expect(calls[0][1].headers.Authorization).toBe('Bearer token');
      expect(calls[0][1].headers['X-Restli-Protocol-Version']).toBe('2.0.0');
    });

    it('throws when likes endpoint returns non-2xx (e.g. 403 from missing r_member_social scope)', async () => {
      (globalThis.fetch as any)
        .mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'insufficient scope' })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ paging: { total: 0 } }) });

      await expect(
        new LinkedInAdapter().fetchAnalytics('t', 'urn:li:ugcPost:1'),
      ).rejects.toThrow(/LinkedIn likes fetch failed.*403/);
    });

    it('defaults paging.total to 0 when field is missing', async () => {
      (globalThis.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const metrics = await new LinkedInAdapter().fetchAnalytics('t', 'urn:li:ugcPost:1');
      expect(metrics).toEqual({ views: 0, likes: 0, shares: 0, commentsCount: 0 });
    });
  });
});
