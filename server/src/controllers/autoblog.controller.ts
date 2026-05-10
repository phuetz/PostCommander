import type { Request, Response } from 'express';
import { getDrizzle } from '../db/connection.js';
import { autoBlogConfigs } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { catchAsync } from '../utils/catch-async.js';
import { AppError } from '../middleware/error-handler.js';
import { requireRequestUser } from '../utils/request-user.js';
import crypto from 'crypto';

export const handleGetConfigs = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const configs = await db
    .select()
    .from(autoBlogConfigs)
    .where(eq(autoBlogConfigs.userId, requestUser.id));

  res.json({ success: true, data: configs });
});

export const handleCreateConfig = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const data = req.body;

  const newConfig = {
    id: crypto.randomUUID(),
    userId: requestUser.id,
    workspaceId: req.workspaceId as string,
    topic: data.topic,
    articleType: data.articleType,
    frequency: data.frequency,
    provider: data.provider,
    model: data.model,
    authorName: data.authorName,
    authorRole: data.authorRole,
    authorReferences: data.authorReferences,
    status: data.status || 'active',
  };

  const db = getDrizzle();
  await db.insert(autoBlogConfigs).values(newConfig);

  res.status(201).json({ success: true, data: newConfig });
});

export const handleUpdateConfig = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params;
  const updates = req.body;

  const db = getDrizzle();
  const [existing] = await db
    .select()
    .from(autoBlogConfigs)
    .where(and(eq(autoBlogConfigs.id, id as string), eq(autoBlogConfigs.userId, requestUser.id)));

  if (!existing) {
    throw new AppError(404, 'Configuration not found');
  }

  const [updated] = await db
    .update(autoBlogConfigs)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(autoBlogConfigs.id, id as string))
    .returning();

  res.json({ success: true, data: updated });
});

export const handleDeleteConfig = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params;

  const db = getDrizzle();
  await db
    .delete(autoBlogConfigs)
    .where(and(eq(autoBlogConfigs.id, id as string), eq(autoBlogConfigs.userId, requestUser.id)));

  res.json({ success: true });
});
