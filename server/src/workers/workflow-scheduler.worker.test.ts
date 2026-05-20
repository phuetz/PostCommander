import { describe, it, expect, vi, beforeEach } from 'vitest';

const dbMock = vi.hoisted(() => {
  const updateSet = vi.fn().mockReturnThis();
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn(() => ({ set: updateSet, where: updateWhere }));
  
  const selectWhere = vi.fn().mockResolvedValue([]);
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: selectWhere,
    })),
  }));
  return { update, updateSet, updateWhere, select, selectWhere };
});

vi.mock('../db/connection.js', () => ({
  getDrizzle: () => ({
    select: dbMock.select,
    update: dbMock.update,
  }),
}));

const scraperQueueMock = vi.hoisted(() => ({
  add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
}));

const schedulerQueueMock = vi.hoisted(() => ({
  getRepeatableJobs: vi.fn().mockResolvedValue([]),
  removeRepeatableByKey: vi.fn(),
  add: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/jobs/queue.js', () => ({
  scraperFlowQueue: scraperQueueMock,
  workflowSchedulerQueue: schedulerQueueMock,
}));

// Mock bullmq to avoid connecting to Redis
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

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.selectWhere.mockResolvedValue([]);
});

describe('runWorkflowSchedulerCycle', () => {
  it('no-ops when active flow list is empty', async () => {
    dbMock.selectWhere.mockResolvedValueOnce([]);
    const { runWorkflowSchedulerCycle } = await import('./workflow-scheduler.worker.js');

    const stats = await runWorkflowSchedulerCycle();

    expect(stats.checked).toBe(0);
    expect(stats.triggered).toBe(0);
    expect(stats.skipped).toBe(0);
    expect(scraperQueueMock.add).not.toHaveBeenCalled();
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it('skips flows that do not have a cron or rss trigger node', async () => {
    const flow = {
      id: 'flow-1',
      name: 'No Trigger Flow',
      userId: 'user-1',
      workspaceId: 'space-1',
      status: 'active',
      flowData: JSON.stringify({
        nodes: [
          { id: 'act-ai_1', type: 'customNode', data: { type: 'action', label: 'AI' } }
        ],
        edges: []
      }),
      lastRunAt: null,
      createdAt: new Date().toISOString(),
    };

    dbMock.selectWhere.mockResolvedValueOnce([flow]);
    const { runWorkflowSchedulerCycle } = await import('./workflow-scheduler.worker.js');

    const stats = await runWorkflowSchedulerCycle();

    expect(stats.checked).toBe(1);
    expect(stats.skipped).toBe(1);
    expect(stats.triggered).toBe(0);
    expect(scraperQueueMock.add).not.toHaveBeenCalled();
  });

  it('triggers flow if elapsed time is greater than interval', async () => {
    // 2 hours ago (interval is 60 minutes)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const flow = {
      id: 'flow-2',
      name: 'Active Cron Flow',
      userId: 'user-1',
      workspaceId: 'space-1',
      status: 'active',
      flowData: JSON.stringify({
        nodes: [
          { id: 'trig-cron_0', type: 'customNode', data: { type: 'trigger', interval: 60 } },
          { id: 'act-ai_1', type: 'customNode', data: { type: 'action' } }
        ],
        edges: []
      }),
      lastRunAt: twoHoursAgo,
      createdAt: twoHoursAgo,
    };

    dbMock.selectWhere.mockResolvedValueOnce([flow]);
    const { runWorkflowSchedulerCycle } = await import('./workflow-scheduler.worker.js');

    const stats = await runWorkflowSchedulerCycle();

    expect(stats.checked).toBe(1);
    expect(stats.triggered).toBe(1);
    expect(stats.skipped).toBe(0);
    expect(scraperQueueMock.add).toHaveBeenCalledWith(
      'execute-flow',
      expect.objectContaining({
        automationId: 'flow-2',
        userId: 'user-1',
        workspaceId: 'space-1',
      }),
      expect.any(Object)
    );
    expect(dbMock.update).toHaveBeenCalled();
  });

  it('does not trigger flow if elapsed time is less than interval', async () => {
    // 10 minutes ago (interval is 60 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const flow = {
      id: 'flow-3',
      name: 'Active RSS Flow',
      userId: 'user-1',
      workspaceId: 'space-1',
      status: 'active',
      flowData: JSON.stringify({
        nodes: [
          { id: 'trig-rss_0', type: 'customNode', data: { type: 'trigger', interval: 60 } },
        ],
        edges: []
      }),
      lastRunAt: tenMinutesAgo,
      createdAt: tenMinutesAgo,
    };

    dbMock.selectWhere.mockResolvedValueOnce([flow]);
    const { runWorkflowSchedulerCycle } = await import('./workflow-scheduler.worker.js');

    const stats = await runWorkflowSchedulerCycle();

    expect(stats.checked).toBe(1);
    expect(stats.triggered).toBe(0);
    expect(stats.skipped).toBe(1);
    expect(scraperQueueMock.add).not.toHaveBeenCalled();
    expect(dbMock.update).not.toHaveBeenCalled();
  });
});
