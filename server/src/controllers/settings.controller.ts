import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import type { ApiResponse, Settings } from '@postcommander/shared';
import { getDrizzle } from '../db/connection.js';
import { settings as settingsTable } from '../db/schema.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';
import { decryptSecret, encryptSecret } from '../utils/secret-crypto.js';

/** Keys that contain sensitive data and should be masked in responses. */
const SENSITIVE_KEYS = new Set([
  'openaiApiKey',
  'anthropicApiKey',
  'googleApiKey',
  'mistralApiKey',
]);

/**
 * Mask an API key for safe display: show first 4 and last 4 chars.
 */
function maskApiKey(value: string): string {
  if (value.length <= 12) {
    return '****';
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

/**
 * GET /api/settings
 * Return all settings with API keys masked.
 */
export const getSettings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const rows = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.userId, requestUser.id));

  const settings: Record<string, string> = {};
  const hasKey: Record<string, boolean> = {};

  for (const row of rows) {
    if (SENSITIVE_KEYS.has(row.key)) {
      const secretValue = decryptSecret(row.value) ?? '';
      settings[row.key] = maskApiKey(secretValue);
      hasKey[row.key] = true;
    } else {
      settings[row.key] = row.value;
    }
  }

  const response: ApiResponse<Settings & { _hasKeys?: Record<string, boolean> }> = {
    success: true,
    data: {
      ...settings,
      _hasKeys: hasKey,
    } as Settings & { _hasKeys?: Record<string, boolean> },
  };

  res.json(response);
});

/**
 * PUT /api/settings
 * Update settings. Only non-empty values are persisted; empty strings remove the key.
 */
export const updateSettings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const db = getDrizzle();
  const body = req.body as Record<string, string | undefined>;

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;

    // If the value looks like a masked key (contains "..."), skip it
    // This prevents overwriting real keys with masked values from the UI
    if (SENSITIVE_KEYS.has(key) && value.includes('...')) {
      continue;
    }

    if (value === '') {
      // Empty string = remove the setting
      await db
        .delete(settingsTable)
        .where(and(eq(settingsTable.userId, requestUser.id), eq(settingsTable.key, key)));
    } else {
      const storedValue = SENSITIVE_KEYS.has(key) ? encryptSecret(value) : value;

      await db
        .insert(settingsTable)
        .values({
          id: randomUUID(),
          userId: requestUser.id,
          key,
          value: storedValue,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: [settingsTable.userId, settingsTable.key],
          set: { value: storedValue, updatedAt: new Date().toISOString() },
        });
    }
  }

  // Return the updated settings (masked)
  const rows = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.userId, requestUser.id));

  const settings: Record<string, string> = {};
  for (const row of rows) {
    if (SENSITIVE_KEYS.has(row.key)) {
      const secretValue = decryptSecret(row.value) ?? '';
      settings[row.key] = maskApiKey(secretValue);
    } else {
      settings[row.key] = row.value;
    }
  }

  const response: ApiResponse<Settings> = {
    success: true,
    data: settings as Settings,
  };

  res.json(response);
});
