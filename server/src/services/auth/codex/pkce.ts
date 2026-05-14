import crypto from 'node:crypto';

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Generate a fresh PKCE verifier+challenge pair (S256).
 * Identical bytes/encoding to openai/codex/codex-rs/login/pkce.rs.
 *
 * 64 random bytes → base64url → `code_verifier`
 * SHA-256(code_verifier) → base64url → `code_challenge`
 */
export function generatePkce(): PkcePair {
  const bytes = crypto.randomBytes(64);
  const codeVerifier = base64UrlEncode(bytes);
  const digest = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64UrlEncode(digest);
  return { codeVerifier, codeChallenge };
}

/** 32-byte random state for CSRF protection (base64url, 43 chars). */
export function generateState(): string {
  return base64UrlEncode(crypto.randomBytes(32));
}
