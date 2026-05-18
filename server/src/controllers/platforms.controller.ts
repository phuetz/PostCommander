import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { and, eq } from 'drizzle-orm';
import {
  PLATFORMS,
  type PlatformId,
  type ApiResponse,
  type PlatformConnection,
} from '@postcommander/shared';
import { getDrizzle } from '../db/connection.js';
import { platformConnections as connectionsTable } from '../db/schema.js';
import { config } from '../config/env.js';
import { AppError } from '../middleware/error-handler.js';
import { catchAsync } from '../utils/catch-async.js';
import { getPlatform } from '../services/platforms/index.js';
import { requireRequestUser } from '../utils/request-user.js';
import { encryptSecret } from '../utils/secret-crypto.js';

interface PlatformWithStatus {
  id: string;
  name: string;
  connected: boolean;
  connection?: PlatformConnection;
}

function getOAuthStateCookieName(platformId: PlatformId): string {
  return `oauth_state_${platformId}`;
}

/**
 * GET /api/platforms
 * List all platforms with their connection status.
 */
export const listPlatforms = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const connections = await db
    .select()
    .from(connectionsTable)
    .where(eq(connectionsTable.userId, requestUser.id));

  const connectionMap = new Map<string, (typeof connections)[number]>();
  for (const conn of connections) {
    connectionMap.set(conn.platform, conn);
  }

  const platformIds = Object.keys(PLATFORMS) as PlatformId[];
  const platforms: PlatformWithStatus[] = platformIds.map((pid) => {
    const p = PLATFORMS[pid];
    const conn = connectionMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      connected: !!conn,
      connection: conn
        ? {
            id: conn.id,
            platform: conn.platform,
            accountName: conn.accountName,
            connected: true,
            connectedAt: conn.connectedAt,
          }
        : undefined,
    };
  });

  const response: ApiResponse<PlatformWithStatus[]> = {
    success: true,
    data: platforms,
  };

  res.json(response);
});

/**
 * GET /api/platforms/:platform/auth
 * Start the OAuth flow — returns the authorization URL.
 */
export const startAuth = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const platformId = req.params.platform as PlatformId;

  if (!(platformId in PLATFORMS)) {
    throw new AppError(400, `Unknown platform: ${platformId}`);
  }

  const adapter = getPlatform(platformId);

  // Generate a state token for CSRF protection
  const state = Buffer.from(
    JSON.stringify({
      platform: platformId,
      userId: requestUser.id,
      nonce: uuidv4(),
      timestamp: Date.now(),
    }),
  ).toString('base64url');

  const authUrl = adapter.getAuthUrl(state);

  res.cookie(getOAuthStateCookieName(platformId), state, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });

  const response: ApiResponse<{ authUrl: string; state: string }> = {
    success: true,
    data: { authUrl, state },
  };

  res.json(response);
});

/**
 * GET /api/platforms/:platform/callback
 * Handle the OAuth callback — exchange code for tokens and store the connection.
 */
export const handleCallback = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const platformId = req.params.platform as PlatformId;

  if (!(platformId in PLATFORMS)) {
    throw new AppError(400, `Unknown platform: ${platformId}`);
  }

  const code = req.query.code as string;
  const error = req.query.error as string;
  const returnedState = req.query.state as string | undefined;
  const expectedState = req.cookies?.[getOAuthStateCookieName(platformId)] as string | undefined;

  if (error) {
    // Redirect back to the client with an error
    res.redirect(
      `${config.CLIENT_URL}/app/settings?platform=${platformId}&error=${encodeURIComponent(error)}`,
    );
    return;
  }

  if (!returnedState || !expectedState || returnedState !== expectedState) {
    res.clearCookie(getOAuthStateCookieName(platformId), {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.redirect(
      `${config.CLIENT_URL}/app/settings?platform=${platformId}&error=${encodeURIComponent('invalid_state')}`,
    );
    return;
  }

  if (!code) {
    throw new AppError(400, 'No authorization code received');
  }

  const adapter = getPlatform(platformId);

  // Exchange the code for tokens
  const tokens = await adapter.exchangeCode(code);

  // Get account info
  let accountName: string | null = null;
  try {
    const account = await adapter.getAccountInfo(tokens.accessToken);
    accountName = account.accountName;
  } catch {
    // Non-critical — we can proceed without the name
  }

  const db = getDrizzle();

  // Remove any existing connection for this platform
  await db
    .delete(connectionsTable)
    .where(
      and(eq(connectionsTable.userId, requestUser.id), eq(connectionsTable.platform, platformId as string)),
    );

  // Store the new connection
  const connectionId = uuidv4();
  const now = new Date().toISOString();
  await db.insert(connectionsTable).values({
    id: connectionId,
    userId: requestUser.id,
    platform: platformId,
    accountName,
    accessToken: encryptSecret(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
    tokenExpires: tokens.expiresAt?.toString() ?? null,
    scopes: tokens.scopes ?? null,
    connectedAt: now,
    updatedAt: now,
  });

  res.clearCookie(getOAuthStateCookieName(platformId), {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  // Redirect back to the client settings page with success
  res.redirect(`${config.CLIENT_URL}/app/settings?platform=${platformId}&connected=true`);
});

/**
 * DELETE /api/platforms/:platform/disconnect
 * Remove a platform connection.
 */
export const disconnectPlatform = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const platformId = req.params.platform as PlatformId;

  if (!(platformId in PLATFORMS)) {
    throw new AppError(400, `Unknown platform: ${platformId}`);
  }

  const db = getDrizzle();

  // First check if it exists
  const [existing] = await db
    .select()
    .from(connectionsTable)
    .where(
      and(eq(connectionsTable.userId, requestUser.id), eq(connectionsTable.platform, platformId as string)),
    )
    .limit(1);

  if (!existing) {
    throw new AppError(404, `No connection found for ${platformId}`);
  }

  await db
    .delete(connectionsTable)
    .where(
      and(eq(connectionsTable.userId, requestUser.id), eq(connectionsTable.platform, platformId as string)),
    );

  const response: ApiResponse = {
    success: true,
  };

  res.json(response);
});
