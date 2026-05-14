import { generatePkce, generateState } from './pkce.js';
import { buildAuthorizeUrl } from './oauth-urls.js';
import { startCallbackListener } from './callback-listener.js';
import { saveAuth } from './storage.js';
import { getChatGptAuth, isConnected, logoutChatGpt } from './get-auth.js';
import { logger } from '../../../utils/logger.js';

export { getChatGptAuth, isConnected, logoutChatGpt };
export type { ChatGptAuth } from './get-auth.js';

export interface StartLoginResult {
  authUrl: string;
  /** Port the server actually bound to (1455 or fallback 1457). */
  port: number;
  /** Resolves when the OAuth flow completes (success or failure). For test/debug only —
   *  the /start endpoint returns *before* this resolves so the client can open the browser. */
  done: Promise<void>;
}

interface InflightLogin {
  expiresAt: number;
  shutdown: () => Promise<void>;
}

/** Per-user inflight login attempts, so /start can be re-called safely (cancels prior). */
const inflight = new Map<string, InflightLogin>();

/**
 * Start the OAuth login dance for a user. Spins up the callback listener on
 * 127.0.0.1:1455 (or 1457), generates the authorize URL, and saves tokens
 * once the user completes the flow in their browser.
 *
 * Returns synchronously after the listener is bound — caller is responsible
 * for opening `authUrl` in the user's browser. Tokens land in the `settings`
 * table when the user redirects back.
 *
 * If the listener can't bind (both ports busy), throws — the caller should
 * surface the CLI fallback instructions to the user.
 */
export async function startLogin(userId: string): Promise<StartLoginResult> {
  // Cancel any in-progress attempt for this user.
  const prior = inflight.get(userId);
  if (prior) {
    await prior.shutdown().catch(() => undefined);
    inflight.delete(userId);
  }

  const pkce = generatePkce();
  const state = generateState();

  const listener = await startCallbackListener({
    expectedState: state,
    codeVerifier: pkce.codeVerifier,
  });

  const authUrl = buildAuthorizeUrl({
    redirectUri: listener.redirectUri,
    codeChallenge: pkce.codeChallenge,
    state,
  });

  inflight.set(userId, {
    expiresAt: Date.now() + 5 * 60 * 1000,
    shutdown: listener.shutdown,
  });

  const done = listener.done
    .then(async (tokens) => {
      try {
        await saveAuth(userId, {
          tokens,
          last_refresh: new Date().toISOString(),
        });
        logger.info({ userId }, 'ChatGPT Pro auth saved');
      } catch (err) {
        logger.error({ err, userId }, 'Failed to save ChatGPT auth');
      } finally {
        inflight.delete(userId);
      }
    })
    .catch((err) => {
      logger.warn({ err: err instanceof Error ? err.message : err, userId }, 'ChatGPT login failed');
      inflight.delete(userId);
    });

  return { authUrl, port: listener.port, done };
}

/** Cancel any pending login (used by the /logout endpoint on the active user). */
export async function cancelLogin(userId: string): Promise<void> {
  const inflightLogin = inflight.get(userId);
  if (inflightLogin) {
    await inflightLogin.shutdown().catch(() => undefined);
    inflight.delete(userId);
  }
}
