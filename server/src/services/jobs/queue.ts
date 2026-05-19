import { Queue, type QueueOptions } from 'bullmq';
import { sharedRedisConnection } from '../../utils/redis.js';

const connection = sharedRedisConnection;

/**
 * Default job options applied to every queue. Without these, BullMQ keeps
 * completed jobs forever (Redis memory growth) and a job that throws is
 * silently dropped (no retry). The retention windows (1 day for completed,
 * 7 days for failed) give bull-board enough history to debug recent issues
 * without filling Redis.
 *
 * Per-queue/per-job overrides remain possible via `queue.add(name, data, opts)`.
 */
const defaultJobOptions: QueueOptions['defaultJobOptions'] = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
};

function makeQueue(name: string): Queue {
  return new Queue(name, {
    connection: connection as QueueOptions['connection'],
    defaultJobOptions,
  });
}

export const postQueue = makeQueue('post-publishing');
export const agentQueue = makeQueue('agent-workflow');
export const autoBlogQueue = makeQueue('auto-blog');
export const outreachQueue = makeQueue('outreach-campaigns');
export const analyticsQueue = makeQueue('analytics-sync');
export const scraperFlowQueue = makeQueue('scraper-flow');

export interface QueueHealth {
  redis: 'ok' | 'error';
  queue: 'ok' | 'error';
  details?: string;
}

export async function getQueueHealth(): Promise<QueueHealth> {
  try {
    const pingResult = await connection.ping();
    if (pingResult !== 'PONG') {
      return {
        redis: 'error',
        queue: 'error',
        details: `Unexpected Redis ping response: ${pingResult}`,
      };
    }

    return {
      redis: 'ok',
      queue: 'ok',
    };
  } catch (error) {
    return {
      redis: 'error',
      queue: 'error',
      details: error instanceof Error ? error.message : 'Unknown Redis error',
    };
  }
}
