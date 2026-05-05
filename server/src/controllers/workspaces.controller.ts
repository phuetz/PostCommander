import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { getDrizzle } from '../db/connection.js';
import { workspaces, workspaceMembers } from '../db/schema.js';
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
    .where(eq(workspaceMembers.userId, user.id));

  res.json({ success: true, data: userMemberships });
});
