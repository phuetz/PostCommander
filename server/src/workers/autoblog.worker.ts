import { Worker, type Job } from 'bullmq';
import { getDrizzle } from '../db/connection.js';
import { autoBlogConfigs, posts } from '../db/schema.js';
import { generateBlogArticle } from '../services/llm/index.js';
import { searchWeb } from '../services/web-search.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

import { sharedRedisConnection } from '../utils/redis.js';
import { liveActivity } from '../services/live-activity.js';
import { attachWorkerObservability } from '../utils/worker-helpers.js';

const connection = sharedRedisConnection;

export const autoBlogWorker = new Worker(
  'auto-blog',
  async (job: Job) => {
    const db = getDrizzle();

    // ----------------------------------------------------------------------
    // Master Job: Dispatcher
    // ----------------------------------------------------------------------
    if (job.name === 'auto-blog-generation') {
      logger.info(`[AutoBlogWorker] Starting auto-blog generation cycle ${job.id}`);

      // Find active configs
      const configs = await db
        .select()
        .from(autoBlogConfigs)
        .where(eq(autoBlogConfigs.status, 'active'));

      logger.info(`[AutoBlogWorker] Found ${configs.length} active configurations`);
      await liveActivity.broadcast('autoblog', `Démarrage du cycle. Règles actives: ${configs.length}`);

      const now = new Date();
      const { autoBlogQueue } = await import('../services/jobs/queue.js');

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
          logger.info(`[AutoBlogWorker] Dispatching generation job for config ${conf.id} (topic: ${conf.topic})`);
          
          // Enqueue individual child job for this specific config
          await autoBlogQueue.add('generate-article', { configId: conf.id }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10000 },
          });
        }
      }

      logger.info(`[AutoBlogWorker] Completed dispatcher cycle`);
      return;
    }

    // ----------------------------------------------------------------------
    // Child Job: Individual Article Generation
    // ----------------------------------------------------------------------
    if (job.name === 'generate-article') {
      const { configId } = job.data;

      const [conf] = await db
        .select()
        .from(autoBlogConfigs)
        .where(eq(autoBlogConfigs.id, configId));

      if (!conf || conf.status !== 'active') {
        logger.info(`[AutoBlogWorker] Config ${configId} no longer active or missing. Skipping.`);
        return;
      }

      logger.info(`[AutoBlogWorker] Processing individual generation for config ${conf.id} (topic: ${conf.topic}) (Attempt: ${job.attemptsMade + 1})`);
      await liveActivity.broadcast('autoblog', `Génération du contenu IA en cours (Topic: ${conf.topic})...`);

      try {
        let similarSources;
        if (conf.articleType === 'news-comment') {
          logger.info(`[AutoBlogWorker] Fetching latest news for topic: ${conf.topic}`);
          const results = await searchWeb(conf.topic, 3);
          if (results.length > 0) {
            similarSources = results.map(r => ({ source: r.title, url: r.url }));
          } else {
            logger.info(`[AutoBlogWorker] No news found for topic: ${conf.topic}`);
            await liveActivity.broadcast('autoblog', `⚠️ Aucune actualité trouvée pour le sujet : ${conf.topic}`, 'warn');
            return; // Soft exit
          }
        }

        // Generate content
        const result = await generateBlogArticle({
          topic: conf.topic,
          articleType: conf.articleType as 'fond-technique' | 'news-comment' | 'opinion-perso',
          provider: conf.provider as any,
          model: conf.model,
          authorName: conf.authorName || undefined,
          authorRole: conf.authorRole || undefined,
          authorReferences: conf.authorReferences ? conf.authorReferences.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
          similarSources,
          language: 'fr',
        }, conf.userId);

        // Save to posts table as scheduled
        const scheduledTime = new Date();
        scheduledTime.setHours(scheduledTime.getHours() + 1); // Schedule 1 hour from now

        await db.insert(posts).values({
          id: crypto.randomUUID(),
          userId: conf.userId,
          workspaceId: conf.workspaceId,
          content: result.content,
          originalPrompt: `[AutoBlog: ${conf.topic}]`,
          llmProvider: conf.provider,
          llmModel: conf.model,
          platforms: JSON.stringify(['linkedin']), // Default platform
          status: 'scheduled',
          scheduledAt: scheduledTime.toISOString(),
        });

        // Update last_generated_at
        const now = new Date();
        await db
          .update(autoBlogConfigs)
          .set({ lastGeneratedAt: now.toISOString(), updatedAt: now.toISOString() })
          .where(eq(autoBlogConfigs.id, conf.id));

        logger.info(`[AutoBlogWorker] Successfully generated and saved draft for config ${conf.id}`);
        await liveActivity.broadcast('autoblog', `✅ Article publié avec succès : "${result.content.slice(0, 50)}..."`, 'success');
      } catch (err) {
        logger.error({ err }, `[AutoBlogWorker] Failed to generate for config ${conf.id}`);
        
        // Only broadcast failure if it's the last attempt to avoid spam
        if (job.attemptsMade === (job.opts.attempts || 1) - 1) {
           await liveActivity.broadcast('autoblog', `❌ Erreur finale après multiples tentatives (Topic: ${conf.topic})`, 'error');
        } else {
           await liveActivity.broadcast('autoblog', `⚠️ Erreur temporaire, nouvelle tentative... (Topic: ${conf.topic})`, 'warn');
        }

        throw err; // Crucial for BullMQ retry mechanism
      }
    }
  },
  { 
    connection: connection as any,
    concurrency: 5, // Allow processing up to 5 generation jobs concurrently
  },
);

attachWorkerObservability(autoBlogWorker, 'auto-blog');

export async function startAutoBlogWorker() {
  const { autoBlogQueue } = await import('../services/jobs/queue.js');
  
  // Clean up old repeatable jobs if any to prevent duplicates
  const repeatableJobs = await autoBlogQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await autoBlogQueue.removeRepeatableByKey(job.key);
  }

  // Add the master dispatcher repeatable job to run every hour
  await autoBlogQueue.add('auto-blog-generation', {}, {
    repeat: {
      pattern: '0 * * * *', // Every hour at minute 0
    },
  });
  
  logger.info('[AutoBlogWorker] Scheduled hourly master dispatcher cycle');
}
