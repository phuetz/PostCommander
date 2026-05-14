import { CLIENT_ID, ISSUER, ORIGINATOR, SCOPES } from './constants.js';

/** Percent-encode a single string per RFC 3986 unreserved set. Pessimistic but safe. */
function percentEncode(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const isUnreserved =
      (c >= 0x41 && c <= 0x5a) || // A-Z
      (c >= 0x61 && c <= 0x7a) || // a-z
      (c >= 0x30 && c <= 0x39) || // 0-9
      c === 0x2d || // -
      c === 0x5f || // _
      c === 0x2e || // .
      c === 0x7e; // ~
    if (isUnreserved) {
      out += s[i];
    } else {
      // Encode each byte of the UTF-8 representation
      const bytes = Buffer.from(s[i], 'utf8');
      for (const b of bytes) {
        out += `%${b.toString(16).toUpperCase().padStart(2, '0')}`;
      }
    }
  }
  return out;
}

export interface AuthorizeUrlInput {
  redirectUri: string;
  codeChallenge: string;
  state: string;
}

/**
 * Build the URL the user opens to start the OAuth flow.
 * Order and casing of params kept identical to gitnexus-rs-from-c
 * `build_authorize_url` (L674-693) — OpenAI rejects unexpected params.
 */
export function buildAuthorizeUrl(input: AuthorizeUrlInput): string {
  const params: Array<[string, string]> = [
    ['response_type', 'code'],
    ['client_id', CLIENT_ID],
    ['redirect_uri', input.redirectUri],
    ['scope', SCOPES],
    ['code_challenge', input.codeChallenge],
    ['code_challenge_method', 'S256'],
    ['id_token_add_organizations', 'true'],
    ['codex_cli_simplified_flow', 'true'],
    ['state', input.state],
    ['originator', ORIGINATOR],
  ];

  const qs = params.map(([k, v]) => `${k}=${percentEncode(v)}`).join('&');
  return `${ISSUER}/oauth/authorize?${qs}`;
}

export function callbackRedirectUri(port: number): string {
  return `http://localhost:${port}/auth/callback`;
}
