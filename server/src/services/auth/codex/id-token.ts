export interface IdTokenClaims {
  account_id?: string;
  email?: string;
  plan_type?: string;
  is_fedramp: boolean;
}

const PROFILE_CLAIM = 'https://api.openai.com/profile';
const AUTH_CLAIM = 'https://api.openai.com/auth';

function base64UrlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

/**
 * Decode the id_token JWT and pull out the ChatGPT-specific claims Codex
 * forwards to its backend.
 *
 * Mirrors `decode_id_token_claims` + `string_claim` / `bool_claim` from the
 * Rust reference (L478-493).
 */
export function decodeIdTokenClaims(idToken: string): IdTokenClaims {
  const empty: IdTokenClaims = { is_fedramp: false };
  const parts = idToken.split('.');
  if (parts.length < 2) return empty;
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]).toString('utf8')) as Record<string, unknown>;
  } catch {
    return empty;
  }

  const profile = isObj(payload[PROFILE_CLAIM]) ? payload[PROFILE_CLAIM] : undefined;
  const auth = isObj(payload[AUTH_CLAIM]) ? payload[AUTH_CLAIM] : undefined;

  return {
    account_id: stringClaim(auth, 'chatgpt_account_id'),
    email: stringClaim(profile, 'email') ?? stringClaim(payload, 'email'),
    plan_type: stringClaim(auth, 'chatgpt_plan_type'),
    is_fedramp: boolClaim(auth, 'chatgpt_account_is_fedramp') ?? false,
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function stringClaim(obj: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!obj) return undefined;
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function boolClaim(obj: Record<string, unknown> | undefined, key: string): boolean | undefined {
  if (!obj) return undefined;
  const v = obj[key];
  return typeof v === 'boolean' ? v : undefined;
}
