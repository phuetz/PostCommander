// Collaboration handlers split out of posts.controller.ts to keep individual
// files under ~400 LOC (was 670). Helpers (schedulePostJob, mapRowToPost) are
// imported from posts.controller.ts; posts.controller.ts re-exports these
// handlers so route imports remain unchanged.

import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import type { ApiResponse, Post, PublishResult, PlatformId } from '@postcommander/shared';
import { getDrizzle } from '../db/connection.js';
import {
  posts as postsTable,
  postComments as postCommentsTable,
  users as usersTable,
  postApprovals as postApprovalsTable,
} from '../db/schema.js';
import { AppError } from '../middleware/error-handler.js';
import { publishPost as publishPostService } from '../services/posts/index.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';
import { mapRowToPost, schedulePostJob } from './posts.controller.js';

/**
 * POST /api/posts/:id/publish
 */
export const publishPost = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const id = req.params.id as string;
  const { platforms } = req.body as { platforms: PlatformId[] };

  const results = await publishPostService(requestUser.id, id, platforms);

  const response: ApiResponse<PublishResult[]> = { success: true, data: results };
  res.json(response);
});

/**
 * POST /api/posts/:id/schedule
 */
export const schedulePost = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;
  const { scheduledAt } = req.body;

  const [existing] = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);
  if (!existing) {
    throw new AppError(404, 'Post not found');
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    throw new AppError(400, 'Invalid scheduled date');
  }
  if (scheduledDate <= new Date()) {
    throw new AppError(400, 'Scheduled time must be in the future');
  }

  await db
    .update(postsTable)
    .set({ status: 'scheduled', scheduledAt, updatedAt: new Date().toISOString() })
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)));

  await schedulePostJob(id, scheduledAt);

  const [row] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);

  res.json({ success: true, data: mapRowToPost(row) } as ApiResponse<Post>);
});

/**
 * GET /api/posts/:id/comments
 */
export const getPostComments = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;

  const [post] = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);
  if (!post) throw new AppError(404, 'Post not found');

  const rows = await db
    .select({
      id: postCommentsTable.id,
      postId: postCommentsTable.postId,
      userId: postCommentsTable.userId,
      content: postCommentsTable.content,
      createdAt: postCommentsTable.createdAt,
      user_id: usersTable.id,
      user_name: usersTable.name,
      user_email: usersTable.email,
      user_avatarUrl: usersTable.avatarUrl,
    })
    .from(postCommentsTable)
    .innerJoin(usersTable, eq(postCommentsTable.userId, usersTable.id))
    .where(eq(postCommentsTable.postId, id))
    .orderBy(desc(postCommentsTable.createdAt));

  const comments = rows.map((row) => ({
    id: row.id,
    postId: row.postId,
    userId: row.userId,
    content: row.content,
    createdAt: row.createdAt,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      avatarUrl: row.user_avatarUrl,
    },
  }));

  res.json({ success: true, data: comments });
});

/**
 * POST /api/posts/:id/comments
 */
export const addPostComment = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;
  const { content } = req.body;

  if (!content) throw new AppError(400, 'Content is required');

  const [post] = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);
  if (!post) throw new AppError(404, 'Post not found');

  const commentId = uuidv4();
  const now = new Date().toISOString();

  await db.insert(postCommentsTable).values({
    id: commentId,
    postId: id,
    userId: requestUser.id,
    content,
    createdAt: now,
  });

  const [row] = await db
    .select({
      id: postCommentsTable.id,
      postId: postCommentsTable.postId,
      userId: postCommentsTable.userId,
      content: postCommentsTable.content,
      createdAt: postCommentsTable.createdAt,
      user_id: usersTable.id,
      user_name: usersTable.name,
      user_email: usersTable.email,
      user_avatarUrl: usersTable.avatarUrl,
    })
    .from(postCommentsTable)
    .innerJoin(usersTable, eq(postCommentsTable.userId, usersTable.id))
    .where(eq(postCommentsTable.id, commentId))
    .limit(1);

  res.status(201).json({
    success: true,
    data: {
      id: row.id,
      postId: row.postId,
      userId: row.userId,
      content: row.content,
      createdAt: row.createdAt,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        avatarUrl: row.user_avatarUrl,
      },
    },
  });
});

/**
 * PATCH /api/posts/:id/status
 */
export const updatePostStatus = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;
  const { status } = req.body;

  if (!['draft', 'needs_approval', 'scheduled'].includes(status)) {
    throw new AppError(400, 'Invalid status update via this endpoint');
  }

  const [existing] = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);
  if (!existing) throw new AppError(404, 'Post not found');

  await db
    .update(postsTable)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)));

  const [row] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);

  res.json({ success: true, data: mapRowToPost(row as any) });
});

/**
 * POST /api/posts/:id/approve
 */
export const approvePost = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;

  const [existing] = await db
    .select({ id: postsTable.id, status: postsTable.status })
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);

  if (!existing) throw new AppError(404, 'Post not found');
  if (existing.status !== 'needs_approval') {
    throw new AppError(400, 'Post is not awaiting approval');
  }

  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.update(postsTable).set({ status: 'approved', updatedAt: now }).where(eq(postsTable.id, id));
    await tx.insert(postApprovalsTable).values({
      id: uuidv4(),
      postId: id,
      userId: requestUser.id,
      status: 'approved',
      createdAt: now,
    });
  });

  const [row] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  res.json({ success: true, data: mapRowToPost(row as any) });
});

/**
 * POST /api/posts/:id/reject
 */
export const rejectPost = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;
  const { feedback } = req.body;

  const [existing] = await db
    .select({ id: postsTable.id, status: postsTable.status })
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);

  if (!existing) throw new AppError(404, 'Post not found');
  if (existing.status !== 'needs_approval') {
    throw new AppError(400, 'Post is not awaiting approval');
  }

  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.update(postsTable).set({ status: 'rejected', updatedAt: now }).where(eq(postsTable.id, id));
    await tx.insert(postApprovalsTable).values({
      id: uuidv4(),
      postId: id,
      userId: requestUser.id,
      status: 'rejected',
      feedback,
      createdAt: now,
    });
  });

  const [row] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  res.json({ success: true, data: mapRowToPost(row as any) });
});
