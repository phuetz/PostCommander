import { lookup } from 'node:dns/promises';
import net from 'node:net';

/**
 * SSRF guard for outbound fetch() calls whose URL is influenced by user input
 * (image proxy, OAuth callback fetchers, web scrapers, RSS, etc).
 *
 * Blocks:
 *   - non-http(s) schemes (file:, gopher:, data:, ftp:, etc.)
 *   - IP literals or DNS names that resolve to: loopback, link-local
 *     (incl. AWS/GCP/Azure metadata 169.254.169.254 and 100.100.100.200),
 *     RFC 1918 private ranges, IPv6 ULA/link-local, broadcast, unspecified.
 *
 * The DNS resolution happens BEFORE the fetch — but Node's fetch will resolve
 * again at connect time (TOCTOU). For high-assurance usage, pin the resolved
 * IP via a custom `dispatcher`. For this codebase (image generator, scraper
 * webhook) the pre-flight check is the right cost/benefit point.
 */

export class SsrfBlockedError extends Error {
  constructor(reason: string, target: string) {
    super(`SSRF guard blocked outbound request to ${target}: ${reason}`);
    this.name = 'SsrfBlockedError';
  }
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/** Hostname-level allowlist override. Use sparingly (e.g. internal services). */
const HOSTNAME_ALLOWLIST = new Set<string>([
  // intentionally empty by default
]);

function isPrivateIPv4(addr: string): boolean {
  const parts = addr.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  // 0.0.0.0/8 unspecified, 127.0.0.0/8 loopback
  if (a === 0 || a === 127) return true;
  // 10.0.0.0/8 private
  if (a === 10) return true;
  // 172.16.0.0/12 private
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 private
  if (a === 192 && b === 168) return true;
  // 100.64.0.0/10 CGNAT (also used by some cloud-internal services)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 169.254.0.0/16 link-local (AWS/GCP/Azure metadata service)
  if (a === 169 && b === 254) return true;
  // 224.0.0.0/4 multicast
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 reserved + 255.255.255.255 broadcast
  if (a >= 240) return true;
  return false;
}

function isPrivateIPv6(addr: string): boolean {
  const lower = addr.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  // fe80::/10 link-local
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
    return true;
  }
  // fc00::/7 unique local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

  // IPv4-mapped IPv6 (::ffff:X). The textual form is "::ffff:a.b.c.d", but
  // node's URL parser canonicalizes to the hex form "::ffff:hhhh:hhhh".
  // Match both: extract the trailing 32 bits and re-check against IPv4 rules.
  const textualMapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (textualMapped) return isPrivateIPv4(textualMapped[1]);

  const hexMapped = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped) {
    const hi = parseInt(hexMapped[1], 16);
    const lo = parseInt(hexMapped[2], 16);
    const dotted = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
    return isPrivateIPv4(dotted);
  }
  return false;
}

export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError('invalid URL', rawUrl);
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new SsrfBlockedError(`scheme "${url.protocol}" not in allowlist`, rawUrl);
  }

  // Strip surrounding brackets that URL parser adds for IPv6 literals.
  const hostname = url.hostname.replace(/^\[|\]$/g, '');

  if (HOSTNAME_ALLOWLIST.has(hostname)) return url;

  // Direct IP literal in URL — check immediately.
  if (net.isIP(hostname)) {
    const family = net.isIP(hostname);
    if (family === 4 && isPrivateIPv4(hostname)) {
      throw new SsrfBlockedError('IPv4 address is in a private/reserved range', rawUrl);
    }
    if (family === 6 && isPrivateIPv6(hostname)) {
      throw new SsrfBlockedError('IPv6 address is in a private/reserved range', rawUrl);
    }
    return url;
  }

  // DNS resolution — block if ANY A/AAAA record points at a private range.
  let resolved: Array<{ address: string; family: number }>;
  try {
    resolved = await lookup(hostname, { all: true });
  } catch (err) {
    throw new SsrfBlockedError(`DNS lookup failed: ${(err as Error).message}`, rawUrl);
  }

  for (const r of resolved) {
    if (r.family === 4 && isPrivateIPv4(r.address)) {
      throw new SsrfBlockedError(
        `hostname "${hostname}" resolves to private IPv4 ${r.address}`,
        rawUrl,
      );
    }
    if (r.family === 6 && isPrivateIPv6(r.address)) {
      throw new SsrfBlockedError(
        `hostname "${hostname}" resolves to private IPv6 ${r.address}`,
        rawUrl,
      );
    }
  }

  return url;
}

/**
 * Drop-in replacement for `fetch(url, init)` that runs the SSRF guard first.
 * On block, throws SsrfBlockedError (caller can map to 400/422).
 */
export async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  await assertSafeUrl(url);
  return fetch(url, init);
}
