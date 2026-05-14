/**
 * Codex OAuth constants — must match openai/codex CLI and gitnexus-rs-from-c.
 * Do not change without verifying parity with the upstream Rust implementation in
 * `D:/CascadeProjects/gitnexus-rs-from-c/crates/gitnexus-cli/src/auth/codex_oauth.rs`.
 */

/** OpenAI public OAuth client id for the Codex CLI. Public — paired with PKCE. */
export const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';

/** OAuth issuer (auth endpoint + token endpoint). */
export const ISSUER = 'https://auth.openai.com';

/** Callback ports — non-negotiable, whitelisted by OpenAI for the Codex client_id. */
export const CALLBACK_PORT = 1455;
export const FALLBACK_CALLBACK_PORT = 1457;

/** Codex backend (Responses API) base. */
export const RESPONSES_URL = 'https://chatgpt.com/backend-api/codex/responses';

export const ORIGINATOR = 'codex_cli_rs';

export const SCOPES =
  'openid profile email offline_access api.connectors.read api.connectors.invoke';

/** How long a cached access_token is considered fresh before refreshing it. */
export const TOKEN_REFRESH_AGE_MS = 60 * 60 * 1000;

/** Login flow timeout (browser must complete the OAuth in this window). */
export const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

/** Settings key under which the encrypted auth JSON is stored per user. */
export const SETTINGS_KEY = 'chatgptProAuth';
