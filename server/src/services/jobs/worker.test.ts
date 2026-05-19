import { describe, it, expect, vi, beforeEach } from 'vitest';

const queryMock = vi.hoisted(() => vi.fn());
const publishPostMock = vi.hoisted(() => vi.fn());

vi.mock('../../db/connection.js', () => ({
  getDb: () => ({ query: queryMock }),
}));

vi.mock('../posts/index.js', () => ({
  publishPost: publishPostMock,
}));

// Bypass BullMQ Worker construction (would try to connect to Redis at import time).
vi.mock('bullmq', () => ({
  Worker: class {
    on() {
      return this;
    }
  },
}));

vi.mock('../../utils/redis.js', () => ({
  sharedRedisConnection: {},
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('processPostPublishJob', () => {
  it('returns not-found when the row does not exist', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const { processPostPublishJob } = await import('./worker.js');
    const result = await processPostPublishJob('missing-id');
    expect(result.outcome).toBe('not-found');
    expect(publishPostMock).not.toHaveBeenCalled();
  });

  it('returns wrong-status when post is not scheduled', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ status: 'draft', platforms: '["twitter"]', user_id: 'u1' }],
    });
    const { processPostPublishJob } = await import('./worker.js');
    const result = await processPostPublishJob('p1');
    expect(result).toMatchObject({ outcome: 'wrong-status', currentStatus: 'draft' });
    expect(publishPostMock).not.toHaveBeenCalled();
  });

  it('returns no-user when post has no owner', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ status: 'scheduled', platforms: '["twitter"]', user_id: null }],
    });
    const { processPostPublishJob } = await import('./worker.js');
    const result = await processPostPublishJob('p2');
    expect(result.outcome).toBe('no-user');
    expect(publishPostMock).not.toHaveBeenCalled();
  });

  it('publishes and returns counts on the happy path', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { status: 'scheduled', platforms: '["twitter","linkedin"]', user_id: 'u1' },
      ],
    });
    publishPostMock.mockResolvedValueOnce([
      { success: true, platform: 'twitter' },
      { success: false, platform: 'linkedin', error: 'rate-limited' },
    ]);

    const { processPostPublishJob } = await import('./worker.js');
    const result = await processPostPublishJob('p3');

    expect(result).toMatchObject({
      outcome: 'published',
      postId: 'p3',
      successCount: 1,
      total: 2,
    });
    expect(publishPostMock).toHaveBeenCalledWith('u1', 'p3', ['twitter', 'linkedin']);
  });

  it('propagates publish errors so BullMQ retries kick in', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ status: 'scheduled', platforms: '["twitter"]', user_id: 'u1' }],
    });
    publishPostMock.mockRejectedValueOnce(new Error('Twitter 503'));
    const { processPostPublishJob } = await import('./worker.js');
    await expect(processPostPublishJob('p4')).rejects.toThrow(/Twitter 503/);
  });
});
