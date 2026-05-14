import { CLIENT_ID, ISSUER } from './constants.js';
import type { OauthTokens } from './token-exchange.js';

/**
 * Use the refresh_token to obtain a fresh access_token.
 *
 * Notable difference vs exchangeCode: the IdP accepts JSON here (mirrors the
 * Rust reference `refresh_tokens` L371-397).
 *
 * The IdP may rotate the refresh_token; merge fields that come back, keep cached
 * values for any field the response omits.
 */
export async function refreshTokens(refreshToken: string): Promise<Partial<OauthTokens>> {
  const resp = await fetch(`${ISSUER}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`token refresh ${resp.status}: ${text.slice(0, 300)}`);
  }

  const json = (await resp.json()) as Partial<OauthTokens>;
  return {
    id_token: json.id_token,
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    account_id: json.account_id,
  };
}

/** Apply a partial refresh response on top of existing tokens, keeping fields the server didn't rotate. */
export function applyTokenRefresh(
  current: OauthTokens,
  fresh: Partial<OauthTokens>,
): OauthTokens {
  return {
    id_token: fresh.id_token ?? current.id_token,
    access_token: fresh.access_token ?? current.access_token,
    refresh_token: fresh.refresh_token ?? current.refresh_token,
    account_id: fresh.account_id ?? current.account_id,
  };
}
