import { eq } from 'drizzle-orm';
import type { PlatformId } from '@postcommander/shared';
import type { BasePlatformAdapter } from './base-platform.js';
import { LinkedInAdapter } from './linkedin.js';
import { TwitterAdapter } from './twitter.js';
import { FacebookAdapter } from './facebook.js';
import { InstagramAdapter } from './instagram.js';
import { TikTokAdapter } from './tiktok.js';
import { PinterestAdapter } from './pinterest.js';
import { getDrizzle } from '../../db/connection.js';
import { platformConnections as connectionsTable } from '../../db/schema.js';
import { decryptSecret, encryptSecret } from '../../utils/secret-crypto.js';
import { logger } from '../../utils/logger.js';

const platformRegistry = new Map<PlatformId, BasePlatformAdapter>();

// Register all platform adapters
function registerPlatforms(): void {
  const adapters: BasePlatformAdapter[] = [
    new LinkedInAdapter(),
    new TwitterAdapter(),
    new FacebookAdapter(),
    new InstagramAdapter(),
    new TikTokAdapter(),
    new PinterestAdapter(),
  ];

  for (const adapter of adapters) {
    platformRegistry.set(adapter.platformId, adapter);
  }
}

// Initialize on module load
registerPlatforms();

/**
 * Get a specific platform adapter by its ID.
 */
export function getPlatform(id: PlatformId): BasePlatformAdapter {
  const adapter = platformRegistry.get(id);
  if (!adapter) {
    throw new Error(`Unknown platform: ${id}`);
  }
  return adapter;
}

/**
 * Get all registered platform adapters.
 */
export function getAllPlatforms(): BasePlatformAdapter[] {
  return Array.from(platformRegistry.values());
}

/**
 * Refresh threshold: how close to expiry we proactively refresh.
 * 5 minutes leaves room for clock skew + the publish call itself.
 */
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

export interface ConnectionRow {
  id: string;
  platform: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpires: string | null;
}

/**
 * Returns a still-valid access token for the given connection. If the stored
 * token is within `REFRESH_BEFORE_EXPIRY_MS` of expiry (or already expired)
 * AND a refresh token is available AND the adapter implements refresh, calls
 * adapter.refreshToken() and persists the new tokens (encrypted) before
 * returning the new access token.
 *
 * Falls back gracefully — if refresh fails or isn't possible, returns the
 * existing decrypted access token and lets the platform's API surface the
 * 401, so the caller can show a useful "reconnect" message.
 */
export async function ensureFreshToken(connection: ConnectionRow): Promise<string> {
  const decrypted = decryptSecret(connection.accessToken) ?? connection.accessToken;
  const decryptedRefresh = connection.refreshToken
    ? (decryptSecret(connection.refreshToken) ?? connection.refreshToken)
    : null;

  // No expiry info → nothing to do.
  if (!connection.tokenExpires) {
    return decrypted;
  }

  const expiresAtMs = Date.parse(connection.tokenExpires);
  if (Number.isNaN(expiresAtMs)) {
    return decrypted;
  }

  if (expiresAtMs - Date.now() > REFRESH_BEFORE_EXPIRY_MS) {
    return decrypted;
  }

  if (!decryptedRefresh) {
    logger.warn(
      { connectionId: connection.id, platform: connection.platform },
      'Token near expiry but no refresh_token available; user must reconnect',
    );
    return decrypted;
  }

  try {
    const adapter = getPlatform(connection.platform as PlatformId);
    const refreshed = await adapter.refreshToken(decryptedRefresh);

    const db = getDrizzle();
    await db
      .update(connectionsTable)
      .set({
        accessToken: encryptSecret(refreshed.accessToken),
        refreshToken: refreshed.refreshToken
          ? encryptSecret(refreshed.refreshToken)
          : connection.refreshToken,
        tokenExpires: refreshed.expiresAt ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(connectionsTable.id, connection.id));

    logger.info(
      { connectionId: connection.id, platform: connection.platform },
      'OAuth token refreshed',
    );
    return refreshed.accessToken;
  } catch (err) {
    logger.error(
      { err, connectionId: connection.id, platform: connection.platform },
      'OAuth token refresh failed; falling back to expired token',
    );
    return decrypted;
  }
}

export { BasePlatformAdapter } from './base-platform.js';
