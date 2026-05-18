import type { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { getDrizzle } from '../db/connection.js';
import { workspaces, workspaceMembers, users } from '../db/schema.js';
import { AppError } from '../middleware/error-handler.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';

export const handleGetWorkspaces = catchAsync(async (req: Request, res: Response) => {
  const user = requireRequestUser(req);
  const db = getDrizzle();

  const userMemberships = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, user.id as string));

  res.json({ success: true, data: userMemberships });
});

export const getWorkspaceMembers = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const workspaceId = req.params.id;

  // Verify access
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId as string),
        eq(workspaceMembers.userId, requestUser.id as string)
      )
    );

  if (!membership) {
    throw new AppError(403, 'Not authorized to view this workspace');
  }

  const members = await db
    .select({
      id: workspaceMembers.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId as string));

  res.json({ success: true, data: members });
});

export const inviteMember = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const workspaceId = req.params.id;
  const { email, role } = req.body;

  if (!email || !role) {
    throw new AppError(400, 'Email and role are required');
  }

  // Verify admin access
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId as string),
        eq(workspaceMembers.userId, requestUser.id as string)
      )
    );

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    throw new AppError(403, 'Admin privileges required');
  }

  // Find user by email
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email as string));

  if (!targetUser) {
    throw new AppError(404, 'User not found in system. Please ask them to register first.');
  }

  // Check existing membership
  const [existing] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId as string),
        eq(workspaceMembers.userId, targetUser.id as string)
      )
    );

  if (existing) {
    throw new AppError(400, 'User is already a member of this workspace');
  }

  // Insert membership
  await db.insert(workspaceMembers).values({
    id: crypto.randomUUID(),
    workspaceId: workspaceId as string,
    userId: targetUser.id,
    role,
  });

  res.status(201).json({ success: true, message: 'Member invited successfully' });
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const workspaceId = req.params.id;
  const targetUserId = req.params.userId;

  // Verify admin access
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId as string),
        eq(workspaceMembers.userId, requestUser.id as string)
      )
    );

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    throw new AppError(403, 'Admin privileges required');
  }

  if (targetUserId === requestUser.id) {
    throw new AppError(400, 'You cannot remove yourself.');
  }

  await db
    .delete(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId as string),
        eq(workspaceMembers.userId, targetUserId as string)
      )
    );

  res.json({ success: true, message: 'Member removed successfully' });
});
