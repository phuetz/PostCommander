import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotImplementedError } from '../services/platforms/base-platform.js';

const dbMock = vi.hoisted(() => {
  const updateSet = vi.fn().mockReturnThis();
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn(() => ({ set: updateSet, where: updateWhere }));
  // chainable select() for both publications join and platformConnections lookup
  const selectChain: any = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };
  const select = vi.fn(() => selectChain);
  return { update, updateSet, updateWhere, selectChain, select };
});

vi.mock('../db/connection.js', () => ({
  getDrizzle: () => ({
    select: dbMock.select,
    update: dbMock.update,
  }),
}));

const fetchAnalyticsMock = vi.hoisted(() => vi.fn());
const ensureFreshTokenMock = vi.hoisted(() => vi.fn());

vi.mock('../services/platforms/index.js', () => ({
  getPlatform: () => ({ fetchAnalytics: fetchAnalyticsMock }),
  ensureFreshToken: ensureFreshTokenMock,
}));

vi.mock('../services/jobs/queue.js', () => ({
  analyticsQueue: {
    getRepeatableJobs: vi.fn().mockResolvedValue([]),
    removeRepeatableByKey: vi.fn(),
    add: vi.fn().mockResolvedValue(undefined),
  },
}));

// Lightweight Worker mock so importing the module doesn't try to connect to Redis.
vi.mock('bullmq', () => ({
  Worker: class {
    on() {
      return this;
    }
  },
}));

vi.mock('../utils/redis.js', () => ({
  sharedRedisConnection: {},
}));

import { config } from '../config/env.js';

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.selectChain.where.mockResolvedValue([]);
});

describe('runAnalyticsSyncCycle', () => {
  it('no-ops with skipped=flag-disabled when ANALYTICS_FETCH_ENABLED is false', async () => {
    // The config snapshot is mutable in test (it's just an object).
    (config as any).ANALYTICS_FETCH_ENABLED = false;
    const { runAnalyticsSyncCycle } = await import('./analytics.worker.js');

    const stats = await runAnalyticsSyncCycle();

    expect(stats.skipped).toBe('flag-disabled');
    expect(stats.synced).toBe(0);
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.update).not.toHaveBeenCalled();
    expect(fetchAnalyticsMock).not.toHaveBeenCalled();
  });

  it('returns skipped=no-publications when DB is empty', async () => {
    (config as any).ANALYTICS_FETCH_ENABLED = true;
    dbMock.selectChain.where.mockResolvedValueOnce([]); // join query returns empty
    const { runAnalyticsSyncCycle } = await import('./analytics.worker.js');

    const stats = await runAnalyticsSyncCycle();

    expect(stats.skipped).toBe('no-publications');
    expect(stats.synced).toBe(0);
    expect(fetchAnalyticsMock).not.toHaveBeenCalled();
  });

  it('skips publications whose adapter throws NotImplementedError', async () => {
    (config as any).ANALYTICS_FETCH_ENABLED = true;

    const pub = {
      id: 'pub1',
      postId: 'post1',
      connectionId: 'conn1',
      platformPostId: 'tw-123',
      hasAutoPlugged: false,
      likes: 0,
      views: 0,
      shares: 0,
      commentsCount: 0,
    };
    const post = { id: 'post1', autoPlugContent: null, autoPlugThreshold: null };
    const conn = {
      id: 'conn1',
      platform: 'linkedin',
      accessToken: 'enc:tok',
      refreshToken: null,
      tokenExpires: null,
    };

    dbMock.selectChain.where
      .mockResolvedValueOnce([{ pub, post }]) // publications join
      .mockResolvedValueOnce([conn]); // platformConnections lookup

    ensureFreshTokenMock.mockResolvedValueOnce('plain-token');
    fetchAnalyticsMock.mockRejectedValueOnce(
      new NotImplementedError('linkedin', 'fetchAnalytics'),
    );

    const { runAnalyticsSyncCycle } = await import('./analytics.worker.js');
    const stats = await runAnalyticsSyncCycle();

    expect(stats.skippedUnsupported).toBe(1);
    expect(stats.synced).toBe(0);
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it('updates publication with real metrics and flags hasAutoPlugged when threshold met', async () => {
    (config as any).ANALYTICS_FETCH_ENABLED = true;

    const pub = {
      id: 'pub2',
      postId: 'post2',
      connectionId: 'conn2',
      platformPostId: 'tw-456',
      hasAutoPlugged: false,
      likes: 5,
      views: 100,
      shares: 0,
      commentsCount: 0,
    };
    const post = {
      id: 'post2',
      autoPlugContent: 'Check my site!',
      autoPlugThreshold: 50,
    };
    const conn = {
      id: 'conn2',
      platform: 'twitter',
      accessToken: 'enc:tok',
      refreshToken: null,
      tokenExpires: null,
    };

    dbMock.selectChain.where
      .mockResolvedValueOnce([{ pub, post }])
      .mockResolvedValueOnce([conn]);

    ensureFreshTokenMock.mockResolvedValueOnce('plain-token');
    fetchAnalyticsMock.mockResolvedValueOnce({
      views: 4200,
      likes: 73, // above threshold 50
      shares: 7,
      commentsCount: 11,
    });

    const { runAnalyticsSyncCycle } = await import('./analytics.worker.js');
    const stats = await runAnalyticsSyncCycle();

    expect(stats.synced).toBe(1);
    expect(stats.skippedUnsupported).toBe(0);
    expect(stats.failed).toBe(0);
    expect(dbMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        views: 4200,
        likes: 73, // SET, not added — no monotonic drift
        shares: 7,
        commentsCount: 11,
        hasAutoPlugged: true, // threshold met
      }),
    );
  });

  it('counts fetch errors as failed without throwing', async () => {
    (config as any).ANALYTICS_FETCH_ENABLED = true;

    const pub = {
      id: 'pub3',
      postId: 'post3',
      connectionId: 'conn3',
      platformPostId: 'tw-789',
      hasAutoPlugged: false,
      likes: 0,
      views: 0,
      shares: 0,
      commentsCount: 0,
    };
    const post = { id: 'post3', autoPlugContent: null, autoPlugThreshold: null };
    const conn = {
      id: 'conn3',
      platform: 'twitter',
      accessToken: 'enc:tok',
      refreshToken: null,
      tokenExpires: null,
    };

    dbMock.selectChain.where
      .mockResolvedValueOnce([{ pub, post }])
      .mockResolvedValueOnce([conn]);

    ensureFreshTokenMock.mockResolvedValueOnce('plain-token');
    fetchAnalyticsMock.mockRejectedValueOnce(new Error('Twitter API 503'));

    const { runAnalyticsSyncCycle } = await import('./analytics.worker.js');
    const stats = await runAnalyticsSyncCycle();

    expect(stats.failed).toBe(1);
    expect(stats.synced).toBe(0);
    expect(dbMock.update).not.toHaveBeenCalled();
  });
});
