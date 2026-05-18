import type { Request, Response } from 'express';
import { getDrizzle } from '../db/connection.js';
import { platformConnections } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';
import crypto from 'crypto';

export const handleConnectPlatform = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { platform } = req.body;

  const db = getDrizzle();

  // MOCK OAuth Flow: We just generate fake tokens for dev/demonstration
  const mockAccessToken = `mock_access_token_${crypto.randomUUID()}`;
  const mockRefreshToken = `mock_refresh_token_${crypto.randomUUID()}`;
  const accountName = `Demo ${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`;

  const existing = await db
    .select()
    .from(platformConnections)
    .where(
      and(
        eq(platformConnections.userId, requestUser.id),
        eq(platformConnections.platform, platform as string)
      )
    );

  if (existing.length > 0) {
    await db
      .update(platformConnections)
      .set({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        accountName,
        updatedAt: new Date().toISOString()
      })
      .where(eq(platformConnections.id, existing[0].id));
  } else {
    await db.insert(platformConnections).values({
      id: crypto.randomUUID(),
      userId: requestUser.id,
      workspaceId: req.workspaceId as string,
      platform,
      accountName,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    });
  }

  res.json({ success: true, message: `Connected to ${platform}` });
});

export const handleDisconnectPlatform = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { platform } = req.params;

  const db = getDrizzle();

  await db
    .delete(platformConnections)
    .where(
      and(
        eq(platformConnections.userId, requestUser.id),
        eq(platformConnections.platform, platform as string)
      )
    );

  res.json({ success: true, message: `Disconnected from ${platform}` });
});
