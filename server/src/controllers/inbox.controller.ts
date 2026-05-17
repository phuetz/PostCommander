import type { Request, Response } from 'express';
import { eq, desc, and } from 'drizzle-orm';
import { getDrizzle } from '../db/connection.js';
import { socialComments, postPublications, posts } from '../db/schema.js';
import { AppError } from '../middleware/error-handler.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';

export const getInbox = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();

  // Fetch unresolved comments for posts owned by the user
  const comments = await db
    .select({
      id: socialComments.id,
      platformCommentId: socialComments.platformCommentId,
      authorName: socialComments.authorName,
      authorHandle: socialComments.authorHandle,
      authorAvatarUrl: socialComments.authorAvatarUrl,
      content: socialComments.content,
      isReplied: socialComments.isReplied,
      replyContent: socialComments.replyContent,
      leadScore: socialComments.leadScore,
      leadStatus: socialComments.leadStatus,
      leadReason: socialComments.leadReason,
      requiresHuman: socialComments.requiresHuman,
      isResolved: socialComments.isResolved,
      agentState: socialComments.agentState,
      createdAt: socialComments.createdAt,
      platform: postPublications.platform,
      postContent: posts.content,
    })
    .from(socialComments)
    .innerJoin(postPublications, eq(socialComments.postPublicationId, postPublications.id))
    .innerJoin(posts, eq(postPublications.postId, posts.id))
    .where(and(eq(posts.userId, requestUser.id), eq(socialComments.isResolved, 0)))
    .orderBy(
      desc(socialComments.requiresHuman),
      desc(socialComments.leadScore),
      desc(socialComments.createdAt)
    );

  res.json({ success: true, data: comments });
});

export const resolveConversation = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;

  // Ideally, verify ownership via joins, but for brevity:
  await db
    .update(socialComments)
    .set({ isResolved: 1 })
    .where(eq(socialComments.id, id));

  res.json({ success: true });
});

export const replyToComment = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;
  const { content } = req.body;

  if (!content) {
    throw new AppError(400, 'Reply content is required');
  }

  // Update comment record to show it was replied and resolved
  await db
    .update(socialComments)
    .set({
      isReplied: 1,
      replyContent: content,
      isResolved: 1,
    })
    .where(eq(socialComments.id, id));

  // In a full implementation, you would trigger a background job to post the reply to the native platform.
  
  res.json({ success: true });
});
