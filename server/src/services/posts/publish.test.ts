import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

interface MockPublishOptions {
  content: string;
  accessToken: string;
  mediaUrls?: string[];
  mediaFiles?: { bytes: Buffer; contentType: string }[];
}

const mockedAdapter = vi.hoisted(() => ({
  publishPost: vi.fn(
    async (
      _options: {
        content: string;
        accessToken: string;
        mediaUrls?: string[];
        mediaFiles?: { bytes: Buffer; contentType: string }[];
      },
    ) => ({
      platformPostId: 'remote-post-1',
      platformUrl: 'https://example.test/p/remote-post-1',
    }),
  ),
}));

vi.mock('../platforms/index.js', () => ({
  getPlatform: vi.fn(() => mockedAdapter),
  ensureFreshToken: vi.fn(async (conn: { accessToken: string }) => conn.accessToken),
}));

vi.mock('../../utils/secret-crypto.js', () => ({
  decryptSecret: vi.fn((value: string | null | undefined) => value ?? null),
}));

import { getDrizzle } from '../../db/connection.js';
import {
  posts as postsTable,
  platformConnections as connectionsTable,
  generatedImages as imagesTable,
} from '../../db/schema.js';
import {
  closeTestDatabase,
  createTestUser,
  initTestDatabase,
  resetTestDatabase,
} from '../../test-utils/test-db.js';
import { publishPost } from './index.js';

describe('publishPost', () => {
  beforeAll(() => {
    initTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetTestDatabase();
  });

  async function seedPostWithConnection(opts: { userId: string; postId: string; platform: string }) {
    const db = getDrizzle();
    await db.insert(postsTable).values({
      id: opts.postId,
      userId: opts.userId,
      content: 'Hello world',
      platforms: JSON.stringify([opts.platform]),
      platformVariants: null,
      hashtags: null,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await db.insert(connectionsTable).values({
      id: randomUUID(),
      userId: opts.userId,
      platform: opts.platform,
      accessToken: 'test-access-token',
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  it('passes mediaUrls from generated_images attached to the post', async () => {
    const user = await createTestUser({ email: 'pub@example.com' });
    const postId = randomUUID();
    await seedPostWithConnection({ userId: user.id, postId, platform: 'linkedin' });

    const db = getDrizzle();
    await db.insert(imagesTable).values({
      id: randomUUID(),
      userId: user.id,
      postId,
      prompt: 'a cat',
      provider: 'openai',
      imageUrl: 'https://cdn.example.test/api/images/file/abc.png',
      imagePath: 'abc.png',
      createdAt: new Date().toISOString(),
    });

    const results = await publishPost(user.id, postId, ['linkedin']);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(mockedAdapter.publishPost).toHaveBeenCalledTimes(1);
    const callArg = mockedAdapter.publishPost.mock.calls[0]![0] as MockPublishOptions;
    expect(callArg.mediaUrls).toEqual(['https://cdn.example.test/api/images/file/abc.png']);
  });

  it('omits mediaUrls when no images are attached', async () => {
    const user = await createTestUser({ email: 'pub2@example.com' });
    const postId = randomUUID();
    await seedPostWithConnection({ userId: user.id, postId, platform: 'linkedin' });

    await publishPost(user.id, postId, ['linkedin']);

    const callArg = mockedAdapter.publishPost.mock.calls[0]![0] as MockPublishOptions;
    expect(callArg.mediaUrls).toBeUndefined();
  });

  it('only includes images owned by the publishing user', async () => {
    const user = await createTestUser({ email: 'owner@example.com' });
    const otherUser = await createTestUser({ email: 'other@example.com' });
    const postId = randomUUID();
    await seedPostWithConnection({ userId: user.id, postId, platform: 'linkedin' });

    const db = getDrizzle();
    // image belonging to a different user but pointing at our postId — should be ignored.
    await db.insert(imagesTable).values({
      id: randomUUID(),
      userId: otherUser.id,
      postId,
      prompt: 'leaked',
      provider: 'openai',
      imageUrl: 'https://leaked.example.test/x.png',
      imagePath: 'x.png',
      createdAt: new Date().toISOString(),
    });

    await publishPost(user.id, postId, ['linkedin']);

    const callArg = mockedAdapter.publishPost.mock.calls[0]![0] as MockPublishOptions;
    expect(callArg.mediaUrls).toBeUndefined();
  });
});
