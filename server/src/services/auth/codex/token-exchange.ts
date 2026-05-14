import { CLIENT_ID, ISSUER } from './constants.js';

export interface OauthTokens {
  id_token: string;
  access_token: string;
  refresh_token: string;
  /** Sometimes returned directly; usually we read it from the id_token claims. */
  account_id?: string;
}

export interface ExchangeCodeInput {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

/**
 * Exchange the authorization code for the OAuth token bundle.
 * Mirrors `exchange_code` (L335-367) in the Rust reference.
 *
 * POSTs `application/x-www-form-urlencoded` — IdP rejects JSON on this endpoint.
 */
export async function exchangeCode(input: ExchangeCodeInput): Promise<OauthTokens> {
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: CLIENT_ID,
    code_verifier: input.codeVerifier,
  });

  const resp = await fetch(`${ISSUER}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`token exchange returned ${resp.status}: ${sanitize(text)}`);
  }

  const json = (await resp.json()) as Partial<OauthTokens>;
  if (!json.id_token || !json.access_token || !json.refresh_token) {
    throw new Error('token exchange response missing required fields');
  }
  return {
    id_token: json.id_token,
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    account_id: json.account_id,
  };
}

function sanitize(s: string): string {
  if (s.length > 300) return `${s.slice(0, 300)}…`;
  return s;
}
