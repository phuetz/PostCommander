# Security operations — PostCommander

**Version** : v1 (2026-05-19)  
**Owner** : Platform team  
**Scope** : runbooks for secret rotation, incident response, and routine security hygiene.

This is a runbook, not a policy. It assumes you have shell access to the prod env (or the secrets manager) and can edit GitHub Actions secrets.

## Quick reference

| Secret | Where stored | Rotation cadence | Procedure |
|---|---|---|---|
| `JWT_SECRET` | env var (`.env` / secrets manager) | quarterly + on suspected leak | [Section A](#a-rotate-jwt_secret) |
| `ENCRYPTION_KEY` | env var | yearly + on suspected leak | [Section B](#b-rotate-encryption_key) |
| `LINKEDIN_SESSION_COOKIE` | env var | when LinkedIn logs out the sa | [Section C](#c-rotate-linkedin_session_cookie) |
| Stripe webhook secret | env var | when rotating Stripe API key | [Section D](#d-rotate-stripe-keys--webhook) |
| Per-user OAuth tokens (LinkedIn, Twitter, etc.) | `platformConnections` table (encrypted) | auto-refresh ; user re-auth on revoke | n/a — handled by `ensureFreshToken` |
| Per-user LLM API keys (`openaiApiKey`, etc.) | `settings` table (encrypted) | user-driven via Settings UI | n/a |

## A. Rotate `JWT_SECRET`

**Impact** : all live JWTs become invalid → every active user is signed out and must log back in. Plan for a low-traffic window.

1. Generate a new secret:
   ```bash
   openssl rand -base64 64
   ```
2. **Pre-update** : in the secrets manager, set `JWT_SECRET_NEXT` (new value). Do NOT replace `JWT_SECRET` yet.
3. **Code change** (future enhancement, not yet implemented) : `auth.ts` should try `verify(token, JWT_SECRET)` first, fall back to `verify(token, JWT_SECRET_NEXT)` to allow a smooth rollover. **Until that lands, the rotation is hard-cutover.**
4. Replace `JWT_SECRET` with the new value, restart the server.
5. Remove `JWT_SECRET_NEXT`.
6. Communicate the forced sign-out in-app (banner + email) if it was a planned rotation.

**Note** : there is no server-side JWT revocation table yet (chantier A4 in the audit). Until then, "revoking" a leaked token = rotating `JWT_SECRET`.

## B. Rotate `ENCRYPTION_KEY`

**Impact** : the `platformConnections.accessToken`, `platformConnections.refreshToken`, and `settings.value` (for `SENSITIVE_SETTINGS` keys: `openaiApiKey`, etc.) are encrypted with AES-256-GCM keyed by `ENCRYPTION_KEY`. Rotation without re-encryption = users lose all platform connections and LLM keys.

### Procedure (rolling re-encryption)

1. Generate a new 32-byte hex key:
   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```
2. Set `ENCRYPTION_KEY_NEXT` in the secrets manager (alongside the old `ENCRYPTION_KEY`).
3. Run the **rotation script** (to be written — placeholder `scripts/rotate-encryption-key.mjs`) :
   - For every row in `platform_connections` and `settings` where `value` starts with `enc:v1:` :
     - `plaintext = decryptSecret(value)` (uses old key from env)
     - `newValue = encryptSecret(plaintext)` (uses new key — script must be invoked with `ENCRYPTION_KEY=$ENCRYPTION_KEY_NEXT`)
     - `UPDATE … SET value = newValue WHERE id = $1`
   - Batch in chunks of 500 to avoid long-running transactions.
4. Swap `ENCRYPTION_KEY` ← `ENCRYPTION_KEY_NEXT`. Restart server.
5. Remove `ENCRYPTION_KEY_NEXT`.

**Rotation script status** : not yet written. Tracked in audit dim 3 (C2).

## C. Rotate `LINKEDIN_SESSION_COOKIE`

Used by `outreachWorker` Stagehand to bypass LinkedIn's login wall when running automated discovery / messaging.

1. Log in to LinkedIn as the service account in a browser.
2. Open DevTools → Application → Cookies → `https://www.linkedin.com` → copy the `li_at` cookie value.
3. Update `LINKEDIN_SESSION_COOKIE` env var. Restart the outreach worker.

**Note** : LinkedIn aggressively invalidates session cookies on detected automation. Pair with `OUTREACH_DRY_RUN=true` initially. Audit dim 3 (C7) suggests moving this to per-user encrypted setting rather than global env.

## D. Rotate Stripe keys & webhook

1. In the Stripe dashboard, generate a new **restricted key** (or roll the secret key if needed).
2. In `Developers → Webhooks → Endpoint`, click "Roll" on the signing secret.
3. Update both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the secrets manager.
4. Restart the server.
5. **Verify** : `stripe trigger payment_intent.succeeded` (Stripe CLI) and check that the webhook handler returns 200.

## E. Secret committed to git — incident response

See [`audit/pocs/crypto/gitleaks-scan.md`](../audit/pocs/crypto/gitleaks-scan.md) for detection + procedure (`git filter-repo`, force-push coordination).

## F. Suspected JWT leak

Until the revoked-tokens table lands :
- Rotate `JWT_SECRET` per [Section A](#a-rotate-jwt_secret).
- All users re-authenticate.
- Audit `pino` logs (`grep -E 'authorization|cookie' logs/`) for anomalous access — these fields are redacted at log time so finding plaintext == config drift, escalate.

## G. Suspected `ENCRYPTION_KEY` leak

- Rotate per [Section B](#b-rotate-encryption_key) immediately.
- Treat **all** stored OAuth tokens & user LLM keys as exposed:
  - For each `platform_connections` row, invalidate at the provider (revoke the token) and force user re-auth (set `accessToken = ''`, send notification email).
  - For each `settings` row with a `SENSITIVE_SETTINGS` key, blank it and notify the user.
- Post-mortem mandatory.

## H. Routine hygiene

- **Quarterly** : run `gitleaks` + `trufflehog` per the procedure doc.
- **Monthly** : review `npm audit --audit-level=high` against the latest baseline.
- **On every PR** : the CI gate (to be added) blocks high+critical vulnerabilities.
- **Yearly** : review who has access to the secrets manager + remove ex-team members' keys.

## I. Out of scope (chantiers futurs)

- JWT revocation table (`revoked_tokens` with `jti`).
- `scripts/rotate-encryption-key.mjs` — needs writing + dry-run mode.
- Per-user `LINKEDIN_SESSION_COOKIE` storage (encrypted, in `settings`).
- Automated rotation cron jobs.

## Changelog

- **v1 — 2026-05-19** : Initial runbook. Covers J/EK/LinkedIn/Stripe rotation, secret-leak response, and routine hygiene.
