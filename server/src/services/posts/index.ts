import { v4 as uuidv4 } from 'uuid';
import { and, eq, desc } from 'drizzle-orm';
import type { PublishResult, PlatformId } from '@postcommander/shared';
import { getDrizzle } from '../../db/connection.js';
import {
  posts as postsTable,
  platformConnections as connectionsTable,
  postPublications as publicationsTable,
  generatedImages as imagesTable,
} from '../../db/schema.js';
import { ensureFreshToken, getPlatform } from '../platforms/index.js';
import { readImageBytes } from '../images/index.js';
import { logger } from '../../utils/logger.js';
import type { MediaFile } from '../platforms/base-platform.js';

/**
 * Publishes a post to one or more platforms.
 * Handles database updates for publications and the post's status.
 */
export async function publishPost(
  userId: string,
  postId: string,
  platforms: PlatformId[],
): Promise<PublishResult[]> {
  const db = getDrizzle();
  const [row] = await db
    .select({
      id: postsTable.id,
      content: postsTable.content,
      platformVariants: postsTable.platformVariants,
      hashtags: postsTable.hashtags,
    })
    .from(postsTable)
    .where(and(eq(postsTable.userId, userId), eq(postsTable.id, postId)))
    .limit(1);

  if (!row) {
    throw new Error(`Post not found: ${postId}`);
  }

  // Parse fields from database row
  const content = row.content;
  const platformVariants = row.platformVariants ? JSON.parse(row.platformVariants) : {};
  const hashtags = row.hashtags ? JSON.parse(row.hashtags) : [];

  // Look up images attached to this post (table generated_images.postId = postId).
  // The URLs are public (served by /api/images/file/:filename) so social-platform
  // fetchers can GET them. Only HTTPS public URLs work for Instagram/Pinterest.
  const attachedImages = await db
    .select({ url: imagesTable.imageUrl, path: imagesTable.imagePath })
    .from(imagesTable)
    .where(and(eq(imagesTable.userId, userId), eq(imagesTable.postId, postId)));
  const usableImages = attachedImages.filter(
    (row): row is { url: string; path: string | null } =>
      typeof row.url === 'string' && row.url.length > 0,
  );
  const mediaUrls = usableImages.map((row) => row.url);

  // Load bytes once for adapters that need multipart upload (LinkedIn, Twitter).
  // URL-based adapters (Facebook, Instagram, Pinterest) use mediaUrls instead.
  let mediaFiles: MediaFile[] = [];
  if (usableImages.length > 0) {
    try {
      mediaFiles = await Promise.all(
        usableImages.map((row) => readImageBytes({ imageUrl: row.url, imagePath: row.path })),
      );
    } catch (err) {
      logger.warn(
        { err, postId },
        'Failed to load image bytes; upload-based platforms will skip media',
      );
      mediaFiles = [];
    }
  }

  const results: PublishResult[] = [];

  for (const platformId of platforms) {
    const pubId = uuidv4();

    // Look up the platform connection
    const [connection] = await db
      .select()
      .from(connectionsTable)
      .where(and(eq(connectionsTable.userId, userId), eq(connectionsTable.platform, platformId)))
      .orderBy(desc(connectionsTable.connectedAt))
      .limit(1);

    if (!connection) {
      const errorMsg = `No ${platformId} account connected. Please connect your account first.`;
      results.push({
        platform: platformId,
        success: false,
        error: errorMsg,
      });

      await db.insert(publicationsTable).values({
        id: pubId,
        postId,
        platform: platformId,
        status: 'failed',
        errorMessage: errorMsg,
        createdAt: new Date().toISOString(),
      });
      continue;
    }

    try {
      const adapter = getPlatform(platformId);
      const platformContent = platformVariants[platformId] ?? content;
      const hashtagString = hashtags.length
        ? '\n\n' + hashtags.map((h: string) => `#${h}`).join(' ')
        : '';

      const accessToken = await ensureFreshToken({
        id: connection.id,
        platform: connection.platform,
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        tokenExpires: connection.tokenExpires,
      });

      const result = await adapter.publishPost({
        content: platformContent + hashtagString,
        accessToken,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
      });

      results.push({
        platform: platformId,
        success: true,
        platformPostId: result.platformPostId,
        platformUrl: result.platformUrl,
      });

      await db.insert(publicationsTable).values({
        id: pubId,
        postId,
        platform: platformId,
        connectionId: connection.id,
        platformPostId: result.platformPostId,
        platformUrl: result.platformUrl,
        status: 'published',
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    } catch (pubErr: any) {
      const errorMsg = pubErr.message || 'Unknown publication error';
      results.push({
        platform: platformId,
        success: false,
        error: errorMsg,
      });

      await db.insert(publicationsTable).values({
        id: pubId,
        postId,
        platform: platformId,
        connectionId: connection.id,
        status: 'failed',
        errorMessage: errorMsg,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Update the post status
  const anySucceeded = results.some((r) => r.success);
  const newStatus = anySucceeded ? 'published' : 'failed';

  await db
    .update(postsTable)
    .set({
      status: newStatus as any,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(postsTable.userId, userId), eq(postsTable.id, postId)));

  return results;
}
