#!/usr/bin/env node
/**
 * Standalone CLI fallback for ChatGPT Pro login.
 *
 * Used when the PostCommander server cannot bind to localhost:1455 (typical
 * cases: remote/cloud deployment, port already in use by another tool).
 *
 * Writes the encrypted token bundle to:
 *   ~/.postcommander/auth/openai.json
 *
 * The server's `getChatGptAuth(userId)` reads the DB first, then falls back to
 * this file. Re-run after revocation or to refresh the cached tokens.
 *
 * Usage:
 *   node scripts/pc-login-chatgpt.mjs
 *
 * Requires the project's `.env` JWT_SECRET (used to derive the encryption key,
 * matching server/src/utils/secret-crypto.ts).
 */
import { createServer } from 'node:http';
import { randomBytes, createHash, createCipheriv } from 'node:crypto';
import { URL } from 'node:url';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const ISSUER = 'https://auth.openai.com';
const PORTS = [1455, 1457];
const SCOPES =
  'openid profile email offline_access api.connectors.read api.connectors.invoke';
const ORIGINATOR = 'codex_cli_rs';

const SECRET_PREFIX = 'enc:v1';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// --- Helpers (kept inline, no workspace deps) -----------------------------------

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function generatePkce() {
  const codeVerifier = b64url(randomBytes(64));
  const codeChallenge = b64url(createHash('sha256').update(codeVerifier).digest());
  return { codeVerifier, codeChallenge };
}

function generateState() {
  return b64url(randomBytes(32));
}

function percentEncode(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const unreserved =
      (c >= 0x41 && c <= 0x5a) ||
      (c >= 0x61 && c <= 0x7a) ||
      (c >= 0x30 && c <= 0x39) ||
      c === 0x2d ||
      c === 0x5f ||
      c === 0x2e ||
      c === 0x7e;
    if (unreserved) {
      out += s[i];
    } else {
      for (const b of Buffer.from(s[i], 'utf8')) {
        out += '%' + b.toString(16).toUpperCase().padStart(2, '0');
      }
    }
  }
  return out;
}

function buildAuthorizeUrl({ redirectUri, codeChallenge, state }) {
  const params = [
    ['response_type', 'code'],
    ['client_id', CLIENT_ID],
    ['redirect_uri', redirectUri],
    ['scope', SCOPES],
    ['code_challenge', codeChallenge],
    ['code_challenge_method', 'S256'],
    ['id_token_add_organizations', 'true'],
    ['codex_cli_simplified_flow', 'true'],
    ['state', state],
    ['originator', ORIGINATOR],
  ];
  const qs = params.map(([k, v]) => `${k}=${percentEncode(v)}`).join('&');
  return `${ISSUER}/oauth/authorize?${qs}`;
}

async function loadJwtSecret() {
  const candidates = [join(repoRoot, '.env'), join(repoRoot, 'server', '.env')];
  for (const path of candidates) {
    try {
      const content = await readFile(path, 'utf8');
      const match = content.match(/^JWT_SECRET\s*=\s*(.+)$/m);
      if (match) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    } catch {
      /* file missing — try next */
    }
  }
  throw new Error('JWT_SECRET introuvable. Configure-le dans .env ou server/.env.');
}

async function loadEncryptionKey() {
  // Mirror server/src/utils/secret-crypto.ts:
  //   - ENCRYPTION_KEY (64-char hex) takes precedence
  //   - else fall back to sha256(JWT_SECRET) (dev only)
  const candidates = [join(repoRoot, '.env'), join(repoRoot, 'server', '.env')];
  for (const path of candidates) {
    try {
      const content = await readFile(path, 'utf8');
      const match = content.match(/^ENCRYPTION_KEY\s*=\s*(.+)$/m);
      if (match) {
        const hex = match[1].trim().replace(/^["']|["']$/g, '');
        if (/^[0-9a-fA-F]{64}$/.test(hex)) {
          return Buffer.from(hex, 'hex');
        }
      }
    } catch {
      /* try next */
    }
  }
  const jwt = await loadJwtSecret();
  return createHash('sha256').update(jwt).digest();
}

function encryptSecret(value, keyBuffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv, { authTagLength: 16 });
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    SECRET_PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

async function exchangeCode({ code, codeVerifier, redirectUri }) {
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier,
  });
  const resp = await fetch(`${ISSUER}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`token exchange ${resp.status}: ${text.slice(0, 200)}`);
  }
  return resp.json();
}

/**
 * Open a URL in the user's default browser without going through the shell —
 * we use spawn with argv array so URL contents can't be interpreted as shell.
 */
function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  let args;
  if (platform === 'win32') {
    // `start` is a cmd.exe builtin — first arg is the window title (empty), second is the URL.
    cmd = process.env.ComSpec ?? 'cmd.exe';
    args = ['/c', 'start', '', url];
  } else if (platform === 'darwin') {
    cmd = 'open';
    args = [url];
  } else {
    cmd = 'xdg-open';
    args = [url];
  }
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.unref();
  } catch {
    /* user can copy the URL manually */
  }
}

// --- Main flow ------------------------------------------------------------------

async function main() {
  const pkce = generatePkce();
  const state = generateState();

  let server;
  let port;
  for (const p of PORTS) {
    try {
      server = await new Promise((resolveServer, rejectServer) => {
        const s = createServer();
        s.once('error', rejectServer);
        s.once('listening', () => resolveServer(s));
        s.listen(p, '127.0.0.1');
      });
      port = p;
      break;
    } catch (err) {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${p} occupé, essai suivant…`);
        continue;
      }
      throw err;
    }
  }
  if (!server) {
    console.error(`Les ports ${PORTS.join('/')} sont indisponibles. Libère-les puis relance.`);
    process.exit(1);
  }

  const redirectUri = `http://localhost:${port}/auth/callback`;
  const authUrl = buildAuthorizeUrl({
    redirectUri,
    codeChallenge: pkce.codeChallenge,
    state,
  });

  console.log('▶  Ouvre cette URL dans ton navigateur (déjà connecté à ChatGPT) :');
  console.log(`   ${authUrl}\n`);
  openBrowser(authUrl);

  const tokens = await new Promise((resolveTokens, rejectTokens) => {
    const timeout = setTimeout(() => {
      rejectTokens(new Error('Timeout après 5 minutes'));
      server.close();
    }, 5 * 60 * 1000);

    server.on('request', async (req, res) => {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
      if (url.pathname !== '/auth/callback') {
        res.writeHead(404).end('Not Found');
        return;
      }
      const params = url.searchParams;
      if (params.get('error')) {
        const err = params.get('error_description') ?? params.get('error');
        res.writeHead(400, { 'Content-Type': 'text/plain' }).end(`OAuth error: ${err}`);
        clearTimeout(timeout);
        server.close();
        rejectTokens(new Error(err));
        return;
      }
      const code = params.get('code');
      const recvState = params.get('state');
      if (!code || recvState !== state) {
        res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Bad request');
        clearTimeout(timeout);
        server.close();
        rejectTokens(new Error('callback missing code or state mismatch'));
        return;
      }
      try {
        const json = await exchangeCode({ code, codeVerifier: pkce.codeVerifier, redirectUri });
        res
          .writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          .end('<h1>Connecté ✓</h1><p>Tu peux fermer cet onglet.</p>');
        clearTimeout(timeout);
        server.close();
        resolveTokens(json);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' }).end(String(err));
        clearTimeout(timeout);
        server.close();
        rejectTokens(err);
      }
    });
  });

  const authFile = {
    tokens: {
      id_token: tokens.id_token,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      account_id: tokens.account_id,
    },
    last_refresh: new Date().toISOString(),
  };

  const key = await loadEncryptionKey();
  const encrypted = encryptSecret(JSON.stringify(authFile), key);

  const outDir = join(homedir(), '.postcommander', 'auth');
  await mkdir(outDir, { recursive: true });
  const outFile = join(outDir, 'openai.json');
  await writeFile(outFile, encrypted, { encoding: 'utf8', mode: 0o600 });

  console.log(`\n✓  Tokens chiffrés et sauvegardés : ${outFile}`);
  console.log('   Le serveur PostCommander lira ce fichier automatiquement.');
}

main().catch((err) => {
  console.error('Échec :', err.message ?? err);
  process.exit(1);
});
