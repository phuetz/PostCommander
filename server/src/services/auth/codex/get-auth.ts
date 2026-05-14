import { TOKEN_REFRESH_AGE_MS } from './constants.js';
import { decodeIdTokenClaims } from './id-token.js';
import { loadAuth, saveAuth, clearAuth, type AuthFile } from './storage.js';
import { refreshTokens, applyTokenRefresh } from './token-refresh.js';
import type { OauthTokens } from './token-exchange.js';

export interface ChatGptAuth {
  access_token: string;
  account_id?: string;
  email?: string;
  plan_type?: string;
  is_fedramp: boolean;
}

function authFromTokens(tokens: OauthTokens): ChatGptAuth {
  const claims = decodeIdTokenClaims(tokens.id_token);
  return {
    access_token: tokens.access_token,
    account_id: tokens.account_id ?? claims.account_id,
    email: claims.email,
    plan_type: claims.plan_type,
    is_fedramp: claims.is_fedramp,
  };
}

/**
 * Load the cached auth for a user, opportunistically refreshing the access_token
 * when older than [TOKEN_REFRESH_AGE_MS]. If the refresh fails (revoked, expired),
 * the cached auth is wiped so callers fall back cleanly to "not connected".
 *
 * Mirrors `get_chatgpt_auth` + `load_current_auth` (L421-468) in the Rust reference.
 */
export async function getChatGptAuth(userId: string): Promise<ChatGptAuth | null> {
  const auth = await loadAuth(userId);
  if (!auth) return null;

  const lastRefresh = Date.parse(auth.last_refresh);
  const age = Number.isFinite(lastRefresh) ? Date.now() - lastRefresh : Infinity;

  if (age < TOKEN_REFRESH_AGE_MS) {
    return authFromTokens(auth.tokens);
  }

  // Stale — refresh.
  try {
    const fresh = await refreshTokens(auth.tokens.refresh_token);
    const merged = applyTokenRefresh(auth.tokens, fresh);
    const updated: AuthFile = {
      tokens: merged,
      last_refresh: new Date().toISOString(),
    };
    await saveAuth(userId, updated);
    return authFromTokens(merged);
  } catch {
    // Likely revoked — wipe so the next call returns null cleanly.
    await clearAuth(userId).catch(() => undefined);
    return null;
  }
}

export async function isConnected(userId: string): Promise<boolean> {
  return (await getChatGptAuth(userId)) !== null;
}

export async function logoutChatGpt(userId: string): Promise<void> {
  await clearAuth(userId);
}
