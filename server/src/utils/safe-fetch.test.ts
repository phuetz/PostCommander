import { describe, it, expect } from 'vitest';
import { assertSafeUrl, SsrfBlockedError } from './safe-fetch.js';

describe('safe-fetch SSRF guard', () => {
  it('allows public https URL', async () => {
    await expect(assertSafeUrl('https://api.openai.com/v1/models')).resolves.toBeInstanceOf(URL);
  });

  it('blocks non-http schemes', async () => {
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl('gopher://x/')).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl('ftp://example.com/')).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('blocks invalid URLs', async () => {
    await expect(assertSafeUrl('not a url')).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('blocks cloud metadata endpoints (AWS/GCP/Azure)', async () => {
    await expect(
      assertSafeUrl('http://169.254.169.254/latest/meta-data/'),
    ).rejects.toThrow(/private/);
  });

  it('blocks loopback', async () => {
    await expect(assertSafeUrl('http://127.0.0.1:6379')).rejects.toThrow(/private/);
    await expect(assertSafeUrl('http://0.0.0.0/')).rejects.toThrow(/private/);
    await expect(assertSafeUrl('http://[::1]/')).rejects.toThrow(/private/);
  });

  it('blocks RFC 1918 private IPv4', async () => {
    await expect(assertSafeUrl('http://10.0.0.1/')).rejects.toThrow(/private/);
    await expect(assertSafeUrl('http://172.16.0.1/')).rejects.toThrow(/private/);
    await expect(assertSafeUrl('http://172.31.255.255/')).rejects.toThrow(/private/);
    await expect(assertSafeUrl('http://192.168.1.1/')).rejects.toThrow(/private/);
  });

  it('allows public IPv4 literal', async () => {
    await expect(assertSafeUrl('https://8.8.8.8/')).resolves.toBeInstanceOf(URL);
  });

  it('blocks IPv6 link-local and unique-local', async () => {
    await expect(assertSafeUrl('http://[fe80::1]/')).rejects.toThrow(/private/);
    await expect(assertSafeUrl('http://[fd00::1]/')).rejects.toThrow(/private/);
  });

  it('blocks IPv4-mapped IPv6 pointing at private space', async () => {
    await expect(assertSafeUrl('http://[::ffff:127.0.0.1]/')).rejects.toThrow(/private/);
    await expect(assertSafeUrl('http://[::ffff:10.0.0.1]/')).rejects.toThrow(/private/);
  });

  it('blocks 172.16-31 private range but allows 172.15 and 172.32 (public)', async () => {
    await expect(assertSafeUrl('http://172.16.0.1/')).rejects.toThrow(/private/);
    await expect(assertSafeUrl('http://172.31.0.1/')).rejects.toThrow(/private/);
    // 172.15 and 172.32 are public IP ranges — should not be blocked.
    await expect(assertSafeUrl('https://172.15.0.1/')).resolves.toBeInstanceOf(URL);
    await expect(assertSafeUrl('https://172.32.0.1/')).resolves.toBeInstanceOf(URL);
  });

  it('blocks CGNAT range (100.64-127)', async () => {
    await expect(assertSafeUrl('http://100.64.0.1/')).rejects.toThrow(/private/);
    await expect(assertSafeUrl('http://100.127.255.255/')).rejects.toThrow(/private/);
  });
});
