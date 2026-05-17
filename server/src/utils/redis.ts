import { Redis } from 'ioredis';
import { config } from '../config/env.js';

/**
 * Shared Redis connection pool for the entire application, including BullMQ workers.
 * Centralizing this prevents connection bloat when scaling workers.
 */
export const sharedRedisConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

/**
 * For BullMQ, you sometimes need a separate connection for blocking commands (like bpop).
 * BullMQ automatically uses a separate connection internally if needed,
 * but sharing the main one is recommended.
 */
export const getSharedRedisConnection = () => sharedRedisConnection;
