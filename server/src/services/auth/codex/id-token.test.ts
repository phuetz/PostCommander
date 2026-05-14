import { describe, it, expect } from 'vitest';
import { decodeIdTokenClaims } from './id-token.js';

function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (s: string) =>
    Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const header = b64url('{"alg":"none"}');
  const body = b64url(JSON.stringify(payload));
  return `${header}.${body}.`;
}

describe('decodeIdTokenClaims', () => {
  it('extracts ChatGPT account claims from id_token', () => {
    const jwt = makeJwt({
      'https://api.openai.com/profile': { email: 'patrice@example.com' },
      'https://api.openai.com/auth': {
        chatgpt_account_id: 'acct_123',
        chatgpt_plan_type: 'plus',
        chatgpt_account_is_fedramp: true,
      },
    });

    const claims = decodeIdTokenClaims(jwt);
    expect(claims.account_id).toBe('acct_123');
    expect(claims.email).toBe('patrice@example.com');
    expect(claims.plan_type).toBe('plus');
    expect(claims.is_fedramp).toBe(true);
  });

  it('returns sensible defaults for an empty id_token', () => {
    const claims = decodeIdTokenClaims('');
    expect(claims.account_id).toBeUndefined();
    expect(claims.email).toBeUndefined();
    expect(claims.is_fedramp).toBe(false);
  });

  it('falls back to top-level email if profile claim missing', () => {
    const jwt = makeJwt({ email: 'fallback@example.com' });
    const claims = decodeIdTokenClaims(jwt);
    expect(claims.email).toBe('fallback@example.com');
  });
});
