import { Queue, type QueueOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../../config/env.js';

const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const postQueue = new Queue('post-publishing', {
  connection: connection as QueueOptions['connection'],
});

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
