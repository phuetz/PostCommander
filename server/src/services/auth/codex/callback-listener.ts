import { createServer, type Server } from 'node:http';
import { URL } from 'node:url';
import { CALLBACK_PORT, FALLBACK_CALLBACK_PORT, LOGIN_TIMEOUT_MS } from './constants.js';
import { exchangeCode } from './token-exchange.js';
import type { OauthTokens } from './token-exchange.js';
import { callbackRedirectUri } from './oauth-urls.js';
import { logger } from '../../../utils/logger.js';

export interface CallbackResult {
  port: number;
  redirectUri: string;
  /** Resolves when the user completes the OAuth flow; rejects on error/timeout. */
  done: Promise<OauthTokens>;
  /** Force-stop the listener (e.g. on app shutdown). */
  shutdown: () => Promise<void>;
}

interface StartOpts {
  expectedState: string;
  codeVerifier: string;
  timeoutMs?: number;
}

/**
 * Bind 127.0.0.1:1455 (or 1457 fallback) for the OAuth callback. The Codex
 * `client_id` only whitelists these two ports. Returns immediately with the
 * redirectUri the caller should plug into the authorize URL.
 *
 * Mirrors `bind_callback_listener` + `callback_handler` (L304-571) in the Rust
 * reference. The `done` promise resolves when the IdP redirects back with a
 * valid code and we successfully swap it for tokens.
 */
export async function startCallbackListener(opts: StartOpts): Promise<CallbackResult> {
  const timeoutMs = opts.timeoutMs ?? LOGIN_TIMEOUT_MS;

  const { server, port } = await bindOnAllowedPort();
  const redirectUri = callbackRedirectUri(port);

  let resolveDone: (tokens: OauthTokens) => void = () => undefined;
  let rejectDone: (err: Error) => void = () => undefined;
  const done = new Promise<OauthTokens>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  // Single-shot guard: callbacks fire exactly once.
  let settled = false;
  const settle = (kind: 'ok' | 'err', payload: OauthTokens | Error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutTimer);
    server.close();
    if (kind === 'ok') resolveDone(payload as OauthTokens);
    else rejectDone(payload as Error);
  };

  const timeoutTimer = setTimeout(() => {
    settle('err', new Error('OAuth login timed out after 5 minutes'));
  }, timeoutMs);

  server.on('request', async (req, res) => {
    if (!req.url) {
      respondError(res, 400, 'missing url');
      return;
    }
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname !== '/auth/callback') {
      respondError(res, 404, 'unknown path');
      return;
    }

    const params = url.searchParams;
    const err = params.get('error');
    if (err) {
      const detail = params.get('error_description') ?? err;
      respondError(res, 400, `OAuth provider error: ${detail}`);
      settle('err', new Error(`OAuth provider error: ${detail}`));
      return;
    }

    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) {
      respondError(res, 400, 'callback missing code or state');
      settle('err', new Error('callback missing code or state'));
      return;
    }
    if (state !== opts.expectedState) {
      respondError(res, 400, 'state mismatch (possible CSRF)');
      settle('err', new Error('state mismatch (possible CSRF)'));
      return;
    }

    try {
      const tokens = await exchangeCode({
        code,
        codeVerifier: opts.codeVerifier,
        redirectUri,
      });
      respondHtml(res, 200, successHtml());
      settle('ok', tokens);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      respondError(res, 500, `token exchange failed: ${msg}`);
      settle('err', e instanceof Error ? e : new Error(msg));
    }
  });

  return {
    port,
    redirectUri,
    done,
    shutdown: async () => {
      settle('err', new Error('shutdown'));
    },
  };
}

async function bindOnAllowedPort(): Promise<{ server: Server; port: number }> {
  for (const port of [CALLBACK_PORT, FALLBACK_CALLBACK_PORT]) {
    try {
      const server = await new Promise<Server>((resolve, reject) => {
        const s = createServer();
        const onError = (e: NodeJS.ErrnoException) => {
          s.off('listening', onListening);
          reject(e);
        };
        const onListening = () => {
          s.off('error', onError);
          resolve(s);
        };
        s.once('error', onError);
        s.once('listening', onListening);
        s.listen(port, '127.0.0.1');
      });
      return { server, port };
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'EADDRINUSE') {
        logger.warn({ port }, 'Codex callback port in use, trying fallback');
        continue;
      }
      throw err;
    }
  }
  throw new Error(
    `callback ports ${CALLBACK_PORT} and ${FALLBACK_CALLBACK_PORT} are both unavailable`,
  );
}

function respondHtml(
  res: { writeHead: (n: number, h: Record<string, string>) => void; end: (s: string) => void },
  status: number,
  html: string,
): void {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function respondError(
  res: { writeHead: (n: number, h: Record<string, string>) => void; end: (s: string) => void },
  status: number,
  message: string,
): void {
  respondHtml(res, status, errorHtml('OAuth callback', message));
}

function successHtml(): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>PostCommander — Connecté</title>
<style>body{font-family:system-ui;background:#0a0a0a;color:#e5e5e5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#171717;border:1px solid #262626;border-radius:12px;padding:32px 40px;max-width:420px;text-align:center}
h1{font-size:18px;margin:0 0 8px;color:#a7f3d0}
p{margin:0;font-size:14px;color:#a3a3a3;line-height:1.5}</style>
</head><body><div class="card"><h1>Authentifié à ChatGPT Pro</h1>
<p>Tu peux fermer cet onglet et retourner dans PostCommander.</p>
<script>setTimeout(() => window.close(), 1200)</script>
</div></body></html>`;
}

function errorHtml(title: string, detail: string): string {
  const safe = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>PostCommander — Erreur OAuth</title>
<style>body{font-family:system-ui;background:#0a0a0a;color:#e5e5e5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#171717;border:1px solid #7f1d1d;border-radius:12px;padding:32px 40px;max-width:520px}
h1{font-size:18px;margin:0 0 12px;color:#fca5a5}
pre{margin:0;font-size:12px;color:#a3a3a3;white-space:pre-wrap;word-break:break-word}</style>
</head><body><div class="card"><h1>${safe(title)}</h1><pre>${safe(detail)}</pre></div></body></html>`;
}
