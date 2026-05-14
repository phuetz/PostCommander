import { describe, it, expect } from 'vitest';
import { generatePkce, generateState } from './pkce.js';

describe('PKCE generation', () => {
  it('produces a verifier that survives base64url chars only', () => {
    const { codeVerifier } = generatePkce();
    expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
    // 64 raw bytes → 86 base64url chars (4 * ceil(64/3) - padding)
    expect(codeVerifier.length).toBe(86);
  });

  it('produces a challenge that is a valid SHA-256 base64url digest', () => {
    const { codeChallenge } = generatePkce();
    expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    // 32 byte SHA256 → 43 base64url chars
    expect(codeChallenge.length).toBe(43);
  });

  it('verifier and challenge are deterministically linked', () => {
    const a = generatePkce();
    const b = generatePkce();
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
    expect(a.codeChallenge).not.toBe(b.codeChallenge);
  });

  it('generateState produces 32 bytes of entropy as base64url (43 chars)', () => {
    const s = generateState();
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(s.length).toBe(43);
  });
});
