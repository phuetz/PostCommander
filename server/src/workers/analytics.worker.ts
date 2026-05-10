import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { getDrizzle } from '../db/connection.js';
import { postPublications, socialComments, platformConnections, posts } from '../db/schema.js';
import { eq, and, isNotNull } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

/**
 * Simulates fetching actual analytics from a social network API.
 * In a real-world scenario, this would use the platform connections' access tokens
 * to call LinkedIn/Twitter APIs to get the real views, likes, and comments.
 */
async function fetchRealPlatformAnalytics(publication: any, connection: any) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return simulated realistic data based on time since published
  const hoursSincePublished = Math.max(
    1,
    Math.floor((Date.now() - new Date(publication.publishedAt).getTime()) / (1000 * 60 * 60)),
  );
  const baseMultiplier = hoursSincePublished * (Math.random() * 2 + 0.5);

  return {
    views: Math.floor(baseMultiplier * 150),
    likes: Math.floor(baseMultiplier * 12),
    shares: Math.floor(baseMultiplier * 2),
    commentsCount: Math.floor(baseMultiplier * 3),
    newComments: Array.from({ length: Math.floor(Math.random() * 3) }).map((_, i) => ({
      platformCommentId: `comment_${publication.id}_${Date.now()}_${i}`,
      authorName: `User ${Math.floor(Math.random() * 1000)}`,
      authorHandle: `@user${Math.floor(Math.random() * 1000)}`,
      content: 'This is a simulated comment retrieved from the platform API!',
      publishedAt: new Date().toISOString(),
    })),
  };
}

export function startAnalyticsWorker() {
  logger.info('Starting Analytics Tracking Worker...');

  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    logger.info('Running scheduled analytics sync...');
    const db = getDrizzle();

    try {
      // Find all published posts that haven't been synced in the last hour
      // For simplicity in this SQLite implementation, we just fetch published posts
      const publications = await db
        .select({
          pub: postPublications,
          post: posts,
        })
        .from(postPublications)
        .innerJoin(posts, eq(postPublications.postId, posts.id))
        .where(
          and(eq(postPublications.status, 'published'), isNotNull(postPublications.connectionId)),
        );

      for (const { pub, post } of publications) {
        if (!pub.connectionId) continue;

        const connection = await db.query.platformConnections.findFirst({
          where: eq(platformConnections.id, pub.connectionId),
        });

        if (!connection) continue;

        try {
          // Fetch the real analytics from the platform
          const analytics = await fetchRealPlatformAnalytics(pub, connection);

          let newLikes = pub.likes ? pub.likes + analytics.likes : analytics.likes;
          let hasAutoPlugged = pub.hasAutoPlugged;

          // ── Auto-Plug Logic ──
          if (
            post.autoPlugContent &&
            post.autoPlugThreshold &&
            newLikes >= post.autoPlugThreshold &&
            !hasAutoPlugged
          ) {
            logger.info(
              `🔥 Auto-Plug threshold reached for post ${post.id}! Publishing comment: "${post.autoPlugContent}"`,
            );
            // In a real scenario, call platform API to post the comment here
            hasAutoPlugged = 1;
          }

          // Update publication stats
          await db
            .update(postPublications)
            .set({
              views: pub.views ? pub.views + analytics.views : analytics.views,
              likes: newLikes,
              shares: pub.shares ? pub.shares + analytics.shares : analytics.shares,
              commentsCount: pub.commentsCount
                ? pub.commentsCount + analytics.commentsCount
                : analytics.commentsCount,
              hasAutoPlugged,
              lastSyncedAt: new Date().toISOString(),
            })
            .where(eq(postPublications.id, pub.id));

          // Insert new comments if any and enqueue them for the Agent SDR
          if (analytics.newComments.length > 0) {
            const commentsToInsert = analytics.newComments.map((c) => ({
              id: uuidv4(),
              postPublicationId: pub.id,
              platformCommentId: c.platformCommentId,
              authorName: c.authorName,
              authorHandle: c.authorHandle,
              content: c.content,
              publishedAt: c.publishedAt,
              isReplied: 0,
            }));

            await db.insert(socialComments).values(commentsToInsert);

            // Enqueue each comment to the agent workflow
            const { agentQueue } = await import('../services/jobs/queue.js');
            for (const comment of commentsToInsert) {
              await agentQueue.add('process-comment', { commentId: comment.id });
              logger.info(`Enqueued new comment ${comment.id} for Agent processing.`);
            }
          }
        } catch (err) {
          logger.error({ err, publicationId: pub.id }, 'Failed to sync analytics for publication');
        }
      }
      logger.info(`Successfully synced analytics for ${publications.length} publications.`);
    } catch (error) {
      logger.error({ error }, 'Analytics worker encountered a fatal error');
    }
  });
}
