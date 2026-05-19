import { Worker, Job, type WorkerOptions } from 'bullmq';
import { getDb } from '../../db/connection.js';
import { logger } from '../../utils/logger.js';
import { publishPost } from '../posts/index.js';
import { attachWorkerObservability } from '../../utils/worker-helpers.js';
import type { PlatformId } from '@postcommander/shared';

interface PostJobData {
  postId: string;
}

import { sharedRedisConnection } from '../../utils/redis.js';

const connection = sharedRedisConnection;

export interface ProcessPostJobResult {
  outcome: 'published' | 'not-found' | 'wrong-status' | 'no-user';
  postId: string;
  successCount?: number;
  total?: number;
  currentStatus?: string;
}

/**
 * Pure processor extracted from the BullMQ Worker binding so it can be unit
 * tested with mocked DB + publishPost — without booting BullMQ or Redis.
 */
export async function processPostPublishJob(postId: string): Promise<ProcessPostJobResult> {
  logger.info({ postId }, 'Processing scheduled post');

  const db = getDb();
  const { rows } = await db.query(
    'SELECT status, platforms, user_id FROM posts WHERE id = $1',
    [postId],
  );
  const row = rows[0] as
    | { status: string; platforms: string; user_id: string | null }
    | undefined;

  if (!row) {
    logger.warn({ postId }, 'No post found with id');
    return { outcome: 'not-found', postId };
  }
  if (row.status !== 'scheduled') {
    logger.warn(
      { postId, currentStatus: row.status },
      'Post is not in scheduled state — skipping',
    );
    return { outcome: 'wrong-status', postId, currentStatus: row.status };
  }
  if (!row.user_id) {
    logger.warn({ postId }, 'Post has no owning user — skipping scheduled publish');
    return { outcome: 'no-user', postId };
  }

  const platforms = JSON.parse(row.platforms) as PlatformId[];
  logger.info({ postId, platforms }, 'Publishing post to platforms');
  const results = await publishPost(row.user_id, postId, platforms);
  const successCount = results.filter((r) => r.success).length;
  logger.info(
    { postId, success: successCount, total: results.length },
    'Finished processing post',
  );
  return { outcome: 'published', postId, successCount, total: results.length };
}

export const postWorker = new Worker<PostJobData>(
  'post-publishing',
  async (job: Job<PostJobData>) => {
    await processPostPublishJob(job.data.postId);
  },
  {
    connection: connection as WorkerOptions['connection'],
    // Tight bound: each publish triggers N platform API calls; over-parallelism
    // saturates rate limits and the DB. Tune up after running autocannon.
    concurrency: 2,
  },
);

postWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed');
});

attachWorkerObservability(postWorker, 'post-publishing');
