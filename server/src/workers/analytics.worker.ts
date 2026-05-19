import { Worker, type Job } from 'bullmq';
import { getDrizzle } from '../db/connection.js';
import { platformConnections, postPublications, posts } from '../db/schema.js';
import { eq, and, isNotNull, inArray } from 'drizzle-orm';
import type { PlatformId } from '@postcommander/shared';
import { logger } from '../utils/logger.js';
import { sharedRedisConnection } from '../utils/redis.js';
import { config } from '../config/env.js';
import { getPlatform, ensureFreshToken } from '../services/platforms/index.js';
import { NotImplementedError, type PlatformMetrics } from '../services/platforms/base-platform.js';
import { analyticsQueue } from '../services/jobs/queue.js';
import { attachWorkerObservability } from '../utils/worker-helpers.js';

const connection = sharedRedisConnection;

export interface AnalyticsSyncStats {
  synced: number;
  skippedUnsupported: number;
  failed: number;
  total: number;
  skipped: 'flag-disabled' | 'no-publications' | null;
}

/**
 * Pure job handler — extracted so it can be unit-tested without booting BullMQ
 * or a Redis connection. The Worker below simply binds this to the queue.
 */
export async function runAnalyticsSyncCycle(): Promise<AnalyticsSyncStats> {
  if (!config.ANALYTICS_FETCH_ENABLED) {
    logger.info(
      '[AnalyticsWorker] ANALYTICS_FETCH_ENABLED=false — skipping fetch cycle (no DB mutation).',
    );
    return { synced: 0, skippedUnsupported: 0, failed: 0, total: 0, skipped: 'flag-disabled' };
  }

  logger.info('[AnalyticsWorker] Starting real analytics sync...');
  const db = getDrizzle();

  const publications = await db
    .select({
      pub: postPublications,
      post: posts,
    })
    .from(postPublications)
    .innerJoin(posts, eq(postPublications.postId, posts.id))
    .where(
      and(
        eq(postPublications.status, 'published'),
        isNotNull(postPublications.connectionId),
        isNotNull(postPublications.platformPostId),
      ),
    );

  if (publications.length === 0) {
    logger.info('[AnalyticsWorker] No published publications to sync.');
    return { synced: 0, skippedUnsupported: 0, failed: 0, total: 0, skipped: 'no-publications' };
  }

  // Batch-load every connection in one query to avoid N+1.
  const connectionIds = Array.from(
    new Set(publications.map((p) => p.pub.connectionId).filter((id): id is string => !!id)),
  );
  const connectionRows = await db
    .select()
    .from(platformConnections)
    .where(inArray(platformConnections.id, connectionIds));
  const connectionsById = new Map(connectionRows.map((c) => [c.id, c]));

  let synced = 0;
  let skippedUnsupported = 0;
  let failed = 0;

  for (const { pub, post } of publications) {
    if (!pub.connectionId || !pub.platformPostId) continue;
    const conn = connectionsById.get(pub.connectionId);
    if (!conn) continue;

    let metrics: PlatformMetrics;
    try {
      const adapter = getPlatform(conn.platform as PlatformId);
      const accessToken = await ensureFreshToken({
        id: conn.id,
        platform: conn.platform,
        accessToken: conn.accessToken,
        refreshToken: conn.refreshToken,
        tokenExpires: conn.tokenExpires,
      });
      metrics = await adapter.fetchAnalytics(accessToken, pub.platformPostId);
    } catch (err) {
      if (err instanceof NotImplementedError) {
        skippedUnsupported++;
        continue;
      }
      failed++;
      logger.error(
        { err, publicationId: pub.id, platform: conn.platform },
        '[AnalyticsWorker] Failed to fetch analytics',
      );
      continue;
    }

    // Auto-plug threshold check, now driven by REAL likes (set, not added).
    let hasAutoPlugged = pub.hasAutoPlugged ?? false;
    if (
      post.autoPlugContent &&
      post.autoPlugThreshold &&
      metrics.likes >= post.autoPlugThreshold &&
      !hasAutoPlugged
    ) {
      logger.info(
        { postId: post.id, likes: metrics.likes, threshold: post.autoPlugThreshold },
        '[AnalyticsWorker] Auto-plug threshold reached — posting comment',
      );
      // TODO: call adapter.postComment(...) once that capability is added.
      hasAutoPlugged = true;
    }

    await db
      .update(postPublications)
      .set({
        views: metrics.views,
        likes: metrics.likes,
        shares: metrics.shares,
        commentsCount: metrics.commentsCount,
        hasAutoPlugged,
        lastSyncedAt: new Date().toISOString(),
      })
      .where(eq(postPublications.id, pub.id));

    synced++;
  }

  const stats: AnalyticsSyncStats = {
    synced,
    skippedUnsupported,
    failed,
    total: publications.length,
    skipped: null,
  };
  logger.info(stats, '[AnalyticsWorker] Sync cycle finished');
  return stats;
}

export const analyticsWorker = new Worker(
  'analytics-sync',
  async (_job: Job) => {
    await runAnalyticsSyncCycle();
  },
  {
    connection: connection as any,
    concurrency: 1,
  },
);

attachWorkerObservability(analyticsWorker, 'analytics-sync');

export async function startAnalyticsWorker() {
  logger.info('[AnalyticsWorker] Scheduling hourly analytics sync...');

  // Clean up existing repeatable jobs to avoid duplicates after redeploy.
  const repeatableJobs = await analyticsQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await analyticsQueue.removeRepeatableByKey(job.key);
  }

  // Deterministic jobId so multi-instance deploys don't double-install.
  await analyticsQueue.add(
    'analytics-sync-job',
    {},
    {
      jobId: 'analytics-sync-recurring',
      repeat: { pattern: '0 * * * *' },
    },
  );
}
