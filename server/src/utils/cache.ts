import { Redis } from 'ioredis';
import { config } from '../config/env.js';
import crypto from 'crypto';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

try {
  redisClient = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
  
  redisClient.on('error', (err) => {
    logger.error({ err }, 'Redis Cache Error');
  });
} catch (error) {
  logger.warn('Failed to initialize Redis for caching, caching will be disabled.');
}

/**
 * Generate a deterministic hash for a cache key
 */
export function generateCacheKey(prefix: string, data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return `${prefix}:${hash}`;
}

/**
 * Get item from cache
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error({ err: error, key }, 'Failed to get from cache');
    return null;
  }
}

/**
 * Set item in cache with TTL (in seconds)
 */
export async function setInCache(key: string, value: any, ttlSeconds: number = 86400): Promise<void> {
  if (!redisClient) return;
  try {
    const data = JSON.stringify(value);
    await redisClient.set(key, data, 'EX', ttlSeconds);
  } catch (error) {
    logger.error({ err: error, key }, 'Failed to set in cache');
  }
}
