import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { and, eq } from 'drizzle-orm';
import { getDrizzle } from '../../../db/connection.js';
import { settings as settingsTable } from '../../../db/schema.js';
import { encryptSecret, decryptSecret } from '../../../utils/secret-crypto.js';
import { logger } from '../../../utils/logger.js';
import { SETTINGS_KEY } from './constants.js';
import type { OauthTokens } from './token-exchange.js';

const CLI_FALLBACK_FILE = join(homedir(), '.postcommander', 'auth', 'openai.json');

export interface AuthFile {
  tokens: OauthTokens;
  /** ISO 8601 — used to decide proactive refresh. */
  last_refresh: string;
}

/**
 * Persist the auth bundle for a user. Encrypts the JSON with the project's
 * `ENCRYPTION_KEY` (AES-256-GCM) before writing to the `settings` table.
 *
 * Mirrors `save_auth` (L195-210) in the Rust reference, minus DPAPI/icacls —
 * we rely on AES + DB file permissions.
 */
export async function saveAuth(userId: string, auth: AuthFile): Promise<void> {
  const payload = JSON.stringify(auth);
  const encrypted = encryptSecret(payload);

  const db = getDrizzle();
  await db
    .insert(settingsTable)
    .values({
      id: randomUUID(),
      userId,
      key: SETTINGS_KEY,
      value: encrypted,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [settingsTable.userId, settingsTable.key],
      set: { value: encrypted, updatedAt: new Date().toISOString() },
    });
}

/** Read and decrypt the stored auth bundle. Returns null if no auth on file. */
export async function loadAuth(userId: string): Promise<AuthFile | null> {
  const db = getDrizzle();
  const rows = await db
    .select()
    .from(settingsTable)
    .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, SETTINGS_KEY)));

  const row = rows[0];
  if (row) {
    try {
      const decrypted = decryptSecret(row.value);
      if (decrypted) return JSON.parse(decrypted) as AuthFile;
    } catch {
      // fall through to file fallback below
    }
  }

  // Fallback: a user (or another tool) ran scripts/pc-login-chatgpt.mjs which
  // wrote the encrypted tokens to ~/.postcommander/auth/openai.json. Import
  // into the DB for this user so subsequent reads use the per-user store.
  return tryImportFromCliFile(userId);
}

async function tryImportFromCliFile(userId: string): Promise<AuthFile | null> {
  let encrypted: string;
  try {
    encrypted = (await readFile(CLI_FALLBACK_FILE, 'utf8')).trim();
  } catch {
    return null;
  }
  let auth: AuthFile;
  try {
    const decrypted = decryptSecret(encrypted);
    if (!decrypted) return null;
    auth = JSON.parse(decrypted) as AuthFile;
  } catch (err) {
    logger.warn(
      { err, file: CLI_FALLBACK_FILE },
      'CLI fallback auth file could not be decrypted (likely encryption key mismatch)',
    );
    return null;
  }
  try {
    await saveAuth(userId, auth);
    // Remove the file once imported — keeps the auth scoped to the DB user.
    await unlink(CLI_FALLBACK_FILE).catch(() => undefined);
    logger.info({ userId }, 'Imported ChatGPT Pro tokens from CLI fallback file');
  } catch (err) {
    logger.warn({ err, userId }, 'Imported CLI auth read OK but DB save failed');
  }
  return auth;
}

/** Delete the stored auth for a user (logout). */
export async function clearAuth(userId: string): Promise<void> {
  const db = getDrizzle();
  await db
    .delete(settingsTable)
    .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, SETTINGS_KEY)));
}
