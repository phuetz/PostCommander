import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, or, like, and, sql, desc } from 'drizzle-orm';
import type {
  ApiResponse,
  PaginatedResponse,
  Post,
  PublishResult,
  PlatformId,
} from '@postcommander/shared';
import { getDrizzle } from '../db/connection.js';
import {
  posts as postsTable,
  postComments as postCommentsTable,
  users as usersTable,
} from '../db/schema.js';
import { AppError } from '../middleware/error-handler.js';
import { postQueue } from '../services/jobs/queue.js';
import { publishPost as publishPostService } from '../services/posts/index.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';

// ── Helpers ──────────────────────────────────────────────────────

interface PostRowShape {
  id: string;
  content: string;
  originalPrompt: string | null;
  tone: string | null;
  llmProvider: string | null;
  llmModel: string | null;
  platforms: string;
  platformVariants: string | null;
  hashtags: string | null;
  autoPlugContent: string | null;
  autoPlugThreshold: number | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListPostsQuery {
  page: number;
  pageSize: number;
  status?: Post['status'];
  search?: string;
}

type PostUpdatableFields = Partial<{
  content: string;
  originalPrompt: string;
  tone: string;
  platforms: string;
  platformVariants: string;
  hashtags: string;
  autoPlugContent: string | null;
  autoPlugThreshold: number | null;
  status: Post['status'];
  scheduledAt: string | null;
  updatedAt: string;
}>;

async function schedulePostJob(postId: string, scheduledAt: string | null) {
  if (!scheduledAt) return;

  const scheduledDate = new Date(scheduledAt);
  const delay = Math.max(0, scheduledDate.getTime() - Date.now());

  await postQueue.add(
    'post-publishing',
    { postId },
    { delay, jobId: postId, removeOnComplete: true },
  );
}

async function removeScheduledJob(postId: string) {
  const job = await postQueue.getJob(postId);
  if (job) {
    await job.remove();
  }
}

function mapRowToPost(row: PostRowShape): Post {
  return {
    id: row.id,
    content: row.content,
    originalPrompt: row.originalPrompt ?? '',
    tone: row.tone ? (row.tone as Post['tone']) : 'professional',
    llmProvider: row.llmProvider ? (row.llmProvider as Post['llmProvider']) : '',
    llmModel: row.llmModel ?? '',
    platforms: row.platforms ? JSON.parse(row.platforms) : [],
    platformVariants: row.platformVariants ? JSON.parse(row.platformVariants) : {},
    hashtags: row.hashtags ? JSON.parse(row.hashtags) : [],
    autoPlugContent: row.autoPlugContent,
    autoPlugThreshold: row.autoPlugThreshold,
    status: row.status as Post['status'],
    scheduledAt: row.scheduledAt ?? null,
    publishedAt: row.publishedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ── Controllers ──────────────────────────────────────────────────

/**
 * GET /api/posts
 */
export const listPosts = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const query = (req.validatedQuery as ListPostsQuery | undefined) ?? {
    page: 1,
    pageSize: 20,
  };
  const { page, pageSize, status, search } = query;
  const offset = (page - 1) * pageSize;

  const db = getDrizzle();

  const filters = [eq(postsTable.userId, requestUser.id)];
  if (status) {
    filters.push(eq(postsTable.status, status));
  }
  if (search) {
    const searchFilter = or(
      like(postsTable.content, `%${search}%`),
      like(postsTable.originalPrompt, `%${search}%`),
    );
    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const totalQuery = db.select({ count: sql<number>`count(*)` }).from(postsTable);
  const [totalResult] = where ? await totalQuery.where(where) : await totalQuery;
  const total = Number(totalResult?.count ?? 0);

  const baseRowsQuery = db.select().from(postsTable);
  const rowsQuery = where ? baseRowsQuery.where(where) : baseRowsQuery;
  const rows = await rowsQuery.orderBy(desc(postsTable.createdAt)).limit(pageSize).offset(offset);

  const posts = rows.map(mapRowToPost);

  const response: PaginatedResponse<Post> = {
    success: true,
    data: posts,
    total,
    page,
    pageSize,
  };

  res.json(response);
});

/**
 * GET /api/posts/:id
 */
export const getPostById = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;
  const [row] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);

  if (!row) {
    throw new AppError(404, 'Post not found');
  }

  const response: ApiResponse<Post> = {
    success: true,
    data: mapRowToPost(row),
  };

  res.json(response);
});

/**
 * POST /api/posts
 */
export const createPost = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = uuidv4();
  const body = req.body;
  const now = new Date().toISOString();

  await db.insert(postsTable).values({
    id,
    userId: requestUser.id,
    content: body.content,
    originalPrompt: body.originalPrompt ?? '',
    tone: body.tone ?? 'professional',
    llmProvider: body.llmProvider ?? '',
    llmModel: body.llmModel ?? '',
    platforms: JSON.stringify(body.platforms),
    platformVariants: JSON.stringify(body.platformVariants ?? {}),
    hashtags: JSON.stringify(body.hashtags ?? []),
    autoPlugContent: body.autoPlugContent ?? null,
    autoPlugThreshold: body.autoPlugThreshold ?? null,
    status: body.status ?? 'draft',
    scheduledAt: body.scheduledAt ?? null,
    createdAt: now,
    updatedAt: now,
  });

  if (body.status === 'scheduled' && body.scheduledAt) {
    await schedulePostJob(id, body.scheduledAt);
  }

  const [row] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);
  const response: ApiResponse<Post> = {
    success: true,
    data: mapRowToPost(row),
  };

  res.status(201).json(response);
});

/**
 * PUT /api/posts/:id
 */
export const updatePost = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;
  const body = req.body;

  const [existing] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);
  if (!existing) {
    throw new AppError(404, 'Post not found');
  }

  const updates: PostUpdatableFields = {
    updatedAt: new Date().toISOString(),
  };

  if (body.content !== undefined) updates.content = body.content;
  if (body.originalPrompt !== undefined) updates.originalPrompt = body.originalPrompt;
  if (body.tone !== undefined) updates.tone = body.tone;
  if (body.platforms !== undefined) updates.platforms = JSON.stringify(body.platforms);
  if (body.platformVariants !== undefined)
    updates.platformVariants = JSON.stringify(body.platformVariants);
  if (body.hashtags !== undefined) updates.hashtags = JSON.stringify(body.hashtags);
  if (body.autoPlugContent !== undefined) updates.autoPlugContent = body.autoPlugContent;
  if (body.autoPlugThreshold !== undefined) updates.autoPlugThreshold = body.autoPlugThreshold;
  if (body.status !== undefined) updates.status = body.status;
  if (body.scheduledAt !== undefined) updates.scheduledAt = body.scheduledAt;

  await db
    .update(postsTable)
    .set(updates)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)));

  if (body.status === 'scheduled' || (body.scheduledAt && existing.status === 'scheduled')) {
    const scheduledAt = body.scheduledAt || existing.scheduledAt;
    await schedulePostJob(id, scheduledAt as string);
  } else if (body.status && body.status !== 'scheduled' && existing.status === 'scheduled') {
    await removeScheduledJob(id);
  }

  const [row] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);
  const response: ApiResponse<Post> = {
    success: true,
    data: mapRowToPost(row),
  };

  res.json(response);
});

/**
 * DELETE /api/posts/:id
 */
export const deletePost = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;

  const [existing] = await db
    .select({ id: postsTable.id, status: postsTable.status })
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);
  if (!existing) {
    throw new AppError(404, 'Post not found');
  }

  if (existing.status === 'scheduled') {
    await removeScheduledJob(id);
  }

  await db
    .delete(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)));

  const response: ApiResponse = { success: true };
  res.json(response);
});

/**
 * POST /api/posts/:id/publish
 */
export const publishPost = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const id = req.params.id as string;
  const { platforms } = req.body as { platforms: PlatformId[] };

  const results = await publishPostService(requestUser.id, id, platforms);

  const response: ApiResponse<PublishResult[]> = {
    success: true,
    data: results,
  };

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
    .set({
      status: 'scheduled',
      scheduledAt: scheduledAt,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)));

  await schedulePostJob(id, scheduledAt);

  const [row] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);
  const response: ApiResponse<Post> = {
    success: true,
    data: mapRowToPost(row),
  };

  res.json(response);
});

/**
 * GET /api/posts/:id/comments
 */
export const getPostComments = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;

  // First verify user owns the post
  const [post] = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);

  if (!post) {
    throw new AppError(404, 'Post not found');
  }

  const commentsRows = await db
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

  const comments = commentsRows.map((row) => ({
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

  const response = { success: true, data: comments };
  res.json(response);
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

  // Fetch the inserted comment
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

  const comment = {
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
  };

  res.status(201).json({ success: true, data: comment });
});

/**
 * PATCH /api/posts/:id/status
 */
export const updatePostStatus = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = req.params.id as string;
  const { status } = req.body;

  if (!['draft', 'pending_approval', 'approved'].includes(status)) {
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
    .set({
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)));

  const [row] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);

  res.json({ success: true, data: mapRowToPost(row as any) });
});

/**
 * POST /api/posts/repurpose-url
 */
export const repurposeUrl = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const id = uuidv4();
  const { url, title, content } = req.body;

  if (!url || !content) {
    throw new AppError(400, 'URL and content are required');
  }

  // Generate a draft post using LLM here in a real scenario
  // For MVP, we'll just create a draft post with the content
  const draftContent = `Just read an interesting article: ${title}\n\nHere are the key takeaways:\n\n${content.substring(0, 200)}...\n\nRead more: ${url}`;

  const now = new Date().toISOString();

  await db.insert(postsTable).values({
    id,
    userId: requestUser.id,
    content: draftContent,
    originalPrompt: `Repurposed from: ${url}`,
    tone: 'professional',
    llmProvider: 'openai',
    llmModel: 'gpt-4o',
    platforms: JSON.stringify(['linkedin']),
    platformVariants: JSON.stringify({}),
    hashtags: JSON.stringify(['repurposed']),
    status: 'draft',
    scheduledAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, requestUser.id), eq(postsTable.id, id)))
    .limit(1);

  const response: ApiResponse<Post> = {
    success: true,
    data: mapRowToPost(row as any),
  };

  res.status(201).json(response);
});
