import { Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config/env.js';
import { getDrizzle } from '../db/connection.js';
import { autoBlogConfigs, posts } from '../db/schema.js';
import { generateBlogArticle } from '../services/llm/index.js';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const connection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const autoBlogWorker = new Worker(
  'auto-blog',
  async (job: Job) => {
    logger.info(`[AutoBlogWorker] Starting auto-blog generation cycle ${job.id}`);

    try {
      // Find active configs
      const db = getDrizzle();
      const configs = await db
        .select()
        .from(autoBlogConfigs)
        .where(eq(autoBlogConfigs.status, 'active'));

      logger.info(`[AutoBlogWorker] Found ${configs.length} active configurations`);

      const now = new Date();

      for (const conf of configs) {
        // Evaluate frequency
        const lastGen = conf.lastGeneratedAt ? new Date(conf.lastGeneratedAt) : new Date(0);
        let shouldGenerate = false;

        const diffHours = (now.getTime() - lastGen.getTime()) / (1000 * 60 * 60);

        if (conf.frequency === 'daily' && diffHours >= 24) {
          shouldGenerate = true;
        } else if (conf.frequency === 'weekly' && diffHours >= 24 * 7) {
          shouldGenerate = true;
        } else if (conf.frequency === 'biweekly' && diffHours >= 24 * 14) {
          shouldGenerate = true;
        } else if (!conf.lastGeneratedAt) {
          shouldGenerate = true;
        }

        if (shouldGenerate) {
          logger.info(`[AutoBlogWorker] Generating article for config ${conf.id} (topic: ${conf.topic})`);
          try {
            // Generate content
            const result = await generateBlogArticle({
              topic: conf.topic,
              articleType: conf.articleType,
              provider: conf.provider,
              model: conf.model,
              authorName: conf.authorName || undefined,
              authorRole: conf.authorRole || undefined,
              authorReferences: conf.authorReferences ? conf.authorReferences.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
              language: 'fr',
            }, conf.userId);

            // Save to posts table as draft
            await db.insert(posts).values({
              id: crypto.randomUUID(),
              userId: conf.userId,
              workspaceId: conf.workspaceId,
              content: result.content,
              originalPrompt: `[AutoBlog: ${conf.topic}]`,
              llmProvider: conf.provider,
              llmModel: conf.model,
              platforms: JSON.stringify(['linkedin']), // Save as standard single platform for draft
              status: 'draft',
            });

            // Update last_generated_at
            await db
              .update(autoBlogConfigs)
              .set({ lastGeneratedAt: now.toISOString(), updatedAt: now.toISOString() })
              .where(eq(autoBlogConfigs.id, conf.id));

            logger.info(`[AutoBlogWorker] Successfully generated and saved draft for config ${conf.id}`);
          } catch (err) {
            logger.error({ err }, `[AutoBlogWorker] Failed to generate for config ${conf.id}`);
          }
        }
      }

      logger.info(`[AutoBlogWorker] Completed auto-blog generation cycle`);
    } catch (error) {
      logger.error({ err: error }, `[AutoBlogWorker] Error processing auto-blog job:`);
      throw error;
    }
  },
  { connection: connection as any },
);

autoBlogWorker.on('failed', (job, err) => {
  logger.error({ err }, `[AutoBlogWorker] Job ${job?.id} failed`);
});

export async function startAutoBlogWorker() {
  const { autoBlogQueue } = await import('../services/jobs/queue.js');
  
  // Clean up old repeatable jobs if any to prevent duplicates
  const repeatableJobs = await autoBlogQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await autoBlogQueue.removeRepeatableByKey(job.key);
  }

  // Add the repeatable job to run every hour
  await autoBlogQueue.add('auto-blog-generation', {}, {
    repeat: {
      pattern: '0 * * * *', // Every hour at minute 0
    },
  });
  
  logger.info('[AutoBlogWorker] Scheduled hourly generation cycle');
}
