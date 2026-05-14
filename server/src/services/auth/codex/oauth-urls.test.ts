import { describe, it, expect } from 'vitest';
import { buildAuthorizeUrl, callbackRedirectUri } from './oauth-urls.js';

describe('buildAuthorizeUrl', () => {
  it('matches the Codex login contract (parity with gitnexus-rs-from-c)', () => {
    const url = buildAuthorizeUrl({
      redirectUri: 'http://localhost:1457/auth/callback',
      codeChallenge: 'challenge-value',
      state: 'state-value',
    });

    expect(url.startsWith('https://auth.openai.com/oauth/authorize?')).toBe(true);
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A1457%2Fauth%2Fcallback');
    expect(url).toContain('originator=codex_cli_rs');
    expect(url).toContain('codex_cli_simplified_flow=true');
    expect(url).toContain('id_token_add_organizations=true');
    expect(url).toContain('code_challenge=challenge-value');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('state=state-value');
    expect(url).toContain('client_id=app_EMoamEEZ73f0CkXaXp7hrann');
  });
});

describe('callbackRedirectUri', () => {
  it('uses the actual bound port', () => {
    expect(callbackRedirectUri(1457)).toBe('http://localhost:1457/auth/callback');
    expect(callbackRedirectUri(1455)).toBe('http://localhost:1455/auth/callback');
  });
});
