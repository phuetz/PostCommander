import { Worker, type Job } from 'bullmq';
import { getDrizzle } from '../db/connection.js';
import { posts, postPublications, platformConnections } from '../db/schema.js';
import { eq, and, lte } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { getPlatform, ensureFreshToken } from '../services/platforms/index.js';
import type { PlatformId } from '@postcommander/shared';
import crypto from 'crypto';

import { sharedRedisConnection } from '../utils/redis.js';

const connection = sharedRedisConnection;

export const publishingWorker = new Worker(
  'post-publishing',
  async (job: Job) => {
    const db = getDrizzle();

    // ----------------------------------------------------------------------
    // Master Dispatcher: Finds scheduled posts due for publishing
    // ----------------------------------------------------------------------
    if (job.name === 'dispatch-due-posts') {
      logger.info(`[PublishingWorker] Checking for due posts...`);

      const now = new Date().toISOString();
      const duePosts = await db
        .select()
        .from(posts)
        .where(
          and(
            eq(posts.status, 'scheduled'),
            lte(posts.scheduledAt, now)
          )
        );

      if (duePosts.length > 0) {
        logger.info(`[PublishingWorker] Found ${duePosts.length} posts due for publishing`);
        const { postQueue } = await import('../services/jobs/queue.js');

        for (const post of duePosts) {
          // Update status to processing to avoid double dispatch
          await db
            .update(posts)
            .set({ status: 'processing', updatedAt: new Date().toISOString() })
            .where(eq(posts.id, post.id));

          await postQueue.add('publish-post', { postId: post.id });
        }
      }
      return;
    }

    // ----------------------------------------------------------------------
    // Child Job: Publish individual post
    // ----------------------------------------------------------------------
    if (job.name === 'publish-post') {
      const { postId } = job.data;
      
      const [post] = await db.select().from(posts).where(eq(posts.id, postId));
      
      if (!post || (post.status !== 'scheduled' && post.status !== 'processing')) {
        logger.info(`[PublishingWorker] Post ${postId} is not valid for publishing (status: ${post?.status})`);
        return;
      }

      logger.info(`[PublishingWorker] Publishing post ${postId}`);
      
      let allPlatformsSuccessful = true;
      let platformsArray: string[] = [];
      try {
        platformsArray = JSON.parse(post.platforms || '[]');
      } catch {
        logger.error(`[PublishingWorker] Invalid platforms JSON for post ${postId}`);
        await db.update(posts).set({ status: 'failed' }).where(eq(posts.id, postId));
        return;
      }

      for (const platform of platformsArray) {
        try {
          // 1. Get connection for user and platform
          const [connectionRow] = await db
            .select()
            .from(platformConnections)
            .where(
              and(
                eq(platformConnections.userId, post.userId!),
                eq(platformConnections.platform, platform as string)
              )
            );

          if (!connectionRow) {
            throw new Error(`No active connection found for ${platform}`);
          }

          // 2. Ensure token is fresh
          const accessToken = await ensureFreshToken(connectionRow);

          // 3. Publish via adapter
          const adapter = getPlatform(platform as PlatformId);
          const result = await adapter.publishPost({
            accessToken,
            content: post.content,
          });

          // 4. Record publication success
          await db.insert(postPublications).values({
            id: crypto.randomUUID(),
            postId: post.id,
            platform,
            connectionId: connectionRow.id,
            platformPostId: result.platformPostId,
            platformUrl: result.platformUrl,
            status: 'published',
            publishedAt: new Date().toISOString(),
          });

          logger.info(`[PublishingWorker] Successfully published ${postId} to ${platform}`);
        } catch (error: any) {
          logger.error({ err: error }, `[PublishingWorker] Failed to publish ${postId} to ${platform}`);
          allPlatformsSuccessful = false;
          
          await db.insert(postPublications).values({
            id: crypto.randomUUID(),
            postId: post.id,
            platform,
            status: 'failed',
            errorMessage: error.message || 'Unknown error',
          });
        }
      }

      // Update parent post status
      await db
        .update(posts)
        .set({
          status: allPlatformsSuccessful ? 'published' : 'failed',
          publishedAt: allPlatformsSuccessful ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(posts.id, postId));
    }
  },
  { 
    connection: connection as any,
    concurrency: 5, 
  }
);

publishingWorker.on('failed', (job, err) => {
  logger.error({ err }, `[PublishingWorker] Job ${job?.name} (${job?.id}) failed`);
});

export async function startPublishingWorker() {
  const { postQueue } = await import('../services/jobs/queue.js');
  
  const repeatableJobs = await postQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === 'dispatch-due-posts') {
      await postQueue.removeRepeatableByKey(job.key);
    }
  }

  // Dispatch due posts every 5 minutes
  await postQueue.add('dispatch-due-posts', {}, {
    repeat: {
      pattern: '*/5 * * * *',
    },
  });
  
  logger.info('[PublishingWorker] Scheduled dispatcher cycle');
}
