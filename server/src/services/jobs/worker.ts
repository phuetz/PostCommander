import { Worker, Job, type WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../../config/env.js';
import { getDb } from '../../db/connection.js';
import { logger } from '../../utils/logger.js';
import { publishPost } from '../posts/index.js';
import type { PlatformId } from '@postcommander/shared';

interface PostJobData {
  postId: string;
}

import { sharedRedisConnection } from '../../utils/redis.js';

const connection = sharedRedisConnection;

export const postWorker = new Worker<PostJobData>(
  'post-publishing',
  async (job: Job<PostJobData>) => {
    const { postId } = job.data;
    logger.info(`Processing scheduled post ${postId}`);

    try {
      const db = getDb();
      const { rows } = await db.query('SELECT status, platforms, user_id FROM posts WHERE id = $1', [postId]); const row = rows[0] as { status: string; platforms: string; user_id: string | null } | undefined;

      if (!row) {
        logger.warn(`No post found with id ${postId}`);
        return;
      }

      if (row.status !== 'scheduled') {
        logger.warn(`Post ${postId} is not in scheduled state (current: ${row.status}). Skipping.`);
        return;
      }

      if (!row.user_id) {
        logger.warn(`Post ${postId} has no owning user. Skipping scheduled publish.`);
        return;
      }

      const platforms = JSON.parse(row.platforms) as PlatformId[];

      logger.info(`Publishing post ${postId} to platforms: ${platforms.join(', ')}`);
      const results = await publishPost(row.user_id, postId, platforms);

      const successCount = results.filter((r) => r.success).length;
      logger.info(`Finished processing post ${postId}. Success: ${successCount}/${results.length}`);
    } catch (error: unknown) {
      logger.error({ error, postId }, 'Failed to publish scheduled post');
      throw error;
    }
  },
  {
    connection: connection as WorkerOptions['connection'],
  },
);

postWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} has completed!`);
});

postWorker.on('failed', (job, err) => {
  logger.error(`${job?.id} has failed with ${err.message}`);
});
