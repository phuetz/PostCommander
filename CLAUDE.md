# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

npm workspaces monorepo with four packages: `client/` (React 19 + Vite), `server/` (Express + TypeScript), `shared/` (types, constants, schemas), `extension/` (browser extension). The shared package is consumed via `@postcommander/shared` and must be built before downstream packages — the root `build` script enforces this order: `shared → server → client`.

Generated output lives in `client/dist` and `shared/dist`; do not hand-edit. The server compiles to `server/dist/` via plain `tsc`.

## Common commands

```bash
npm install                    # one-time, at repo root
npm run dev                    # runs server (3001) + client (5173) concurrently
npm run build                  # shared → server → client, in order
npm start                      # runs prebuilt server (which serves client/dist in production)

npm run lint                   # ESLint 9 across the repo
npm run format                 # Prettier 3
npm run typecheck              # tsc --noEmit on shared + server + client
npm run test                   # shared + server vitest suites
npm run test:e2e               # Playwright; spins up its own server (3101) and client (4173)
npm run verify                 # lint + build + test
npm run verify:release         # verify + e2e
npm run db:reset               # truncate dev tables (Postgres)
npm run db:backup              # pg_dump → server/data/backups/ (--keep N, --out DIR)

# Workspace-scoped
npm test -w @postcommander/server                     # all server tests
npm test -w @postcommander/server -- path/to.test.ts  # single file
npm test -w @postcommander/shared
```

There is no client unit-test runner; UI is covered by Playwright e2e under `tests/e2e/`. The Playwright dev server is launched via `scripts/playwright-dev-server.mjs` and uses isolated ports — set `PLAYWRIGHT_REUSE_SERVER=true` to attach to an already-running instance.

## Architecture

### Server boot sequence (`server/src/index.ts` → `app.ts`)

1. **Sentry init** (if `SENTRY_DSN` set): sampling driven by `SENTRY_TRACES_SAMPLE_RATE` / `SENTRY_PROFILES_SAMPLE_RATE` (defaults 0.1 / 0.01), with `beforeSend` scrubbing PII from headers, cookies, and credential-bearing body fields.
2. **`initDb()`** opens the Postgres pool from `DATABASE_URL`. Drizzle ORM (`drizzle-orm/pg-core`) is exposed via `getDrizzle()`; raw `pg` client via `getDb()`.
3. **`runMigrations()`** applies pending Drizzle migrations from `server/drizzle/` at boot.
4. Reference data seeded (`seedViralPosts`, `seedTemplates`).
5. Workers imported for side effects: `services/jobs/{worker,agent.worker,scraper.worker}.ts` plus `workers/{autoblog,outreach}.worker.ts`.
6. Scheduled cron workers started: `startAnalyticsWorker()`, `startAutoBlogWorker()`, `startOutreachWorker()`, `startPublishingWorker()`.
7. `createApp()` wires Helmet/CORS/rate limiting (`middleware/setup.ts`), cookie parsing, the **Stripe webhook with `express.raw` BEFORE `express.json`** (signature verification depends on the raw body), then JSON body parsing, then `/api` routes.

### Analytics adapter coverage & required scopes

| Platform | `fetchAnalytics` impl | OAuth scopes for analytics | Notes |
|---|---|---|---|
| Twitter | ✅ `/2/tweets/{id}?tweet.fields=public_metrics` | `tweet.read` (default) | views = impression_count |
| LinkedIn | ✅ `/v2/socialActions/{urn}/{likes,comments}` | **`r_member_social`** (added 2026-05-19 — old connections must reconnect) | views/shares = 0 (gated Marketing API) |
| Facebook | ✅ `/v19.0/{post_id}?fields=likes.summary(true),...` | page access token (already used for publishing) | views = 0 (would need `read_insights` + Page Insights API) |
| Instagram | ✅ `/v19.0/{media_id}/insights?metric=...` | **`instagram_basic` + `instagram_manage_insights`** | Requires IG Business / Creator account, 400 otherwise |
| Pinterest | ✅ `/v5/pins/{pin_id}/analytics` | `pins:read` + `user_accounts:read` | Date-range query (last 30 d); SAVE→shares, REACTION→likes |
| TikTok | ❌ NotImplementedError | n/a | API gated (business account approval multi-semaines) |

When adding a new platform, override `fetchAnalytics(accessToken, platformPostId)` on its adapter — return `PlatformMetrics` shape (views/likes/shares/commentsCount, all `number`).

### Worker feature flags (defaults safe — no fake data ships)

Several workers are guarded behind boolean env flags. Defaults are `false` so an unfinished integration never ships fake user-visible data:

- **`ANALYTICS_FETCH_ENABLED`** (default `false`): when off, the hourly analytics-sync worker logs once per cycle and no-ops (no DB mutation, no auto-plug trigger). When on, it dispatches `adapter.fetchAnalytics(token, platformPostId)` per publication — Twitter v2 `public_metrics` is implemented; other adapters throw `NotImplementedError` and the worker skips them (counted as `skippedUnsupported`).
- **`OUTREACH_AUTO_DISCOVERY`** (default `false`): when off, the outreach worker only advances the drip sequence for prospects added explicitly via `/api/outreach/osint-scan` + `/add-from-osint`. When on, the worker would attempt Stagehand-based discovery (not yet implemented).
- **`OUTREACH_DRY_RUN`** (default `true`): when on, Stagehand types the message but clicks "Discard" instead of "Send".

To add a real-API integration for analytics on a new platform, override `fetchAnalytics` on its adapter in `server/src/services/platforms/<platform>.ts`.

### Server routing pattern

`routes/index.ts` mounts feature routers under `/api/*`. Key routes include `/auth`, `/generate`, `/posts`, `/platforms`, `/analytics`, `/workspaces`, `/admin`, and more. Each feature follows `routes → controllers → services` separation. Authentication is a JWT in either an httpOnly cookie or `Authorization: Bearer` header (`middleware/auth.ts`); admin status is granted by either DB role or by email match against `ADMIN_EMAILS` (comma-separated env). All routes that read user data must apply user scoping — see migration `006_user_scoping.sql` for context. The Bull Board UI (job queue monitoring) is mounted by `setupBullBoard(router)` and is admin-protected.

Health and status endpoints:

- `GET /api/health` — full health check (database, Redis, queue status)
- `GET /api/live` — lightweight liveness check (uptime, version)

### LLM abstraction (`server/src/services/llm/`)

`provider-factory.ts` returns a Vercel AI SDK model based on `provider` (`openai` | `anthropic` | `google` | `mistral` | `ollama`). Keys can come from env OR from the `settings` table per-user — when a `userId` is passed to `createModel`, user-stored keys take precedence. The factory plus `prompts.ts` is the only place new providers should be wired in. Streaming generation uses `streamText` from `ai`; non-streaming uses `generateText`. Output is JSON parsed via `parseJsonResponse` which tolerates markdown code fences.

### Shared API contract

All HTTP responses follow `ApiResponse<T>` / `PaginatedResponse<T>` from `shared/src/types/api.ts`. Place request/response shapes and platform/tone/provider constants in `shared/src/`, never duplicate them across client and server. Import as `@postcommander/shared`.

### Client structure (`client/src/`)

`App.tsx` lazy-loads every page. Authenticated app routes live under `/app/*` behind `<ProtectedRoute>`; admin-only pages additionally wrap in `<AdminRoute>`. Marketing pages share `MarketingLayout`. Server state goes through TanStack Query; Axios is configured in `services/api.ts` with `withCredentials: true` so the auth cookie flows. Path alias `@/*` resolves to `client/src/*`.

### Database migrations

The DB is **Postgres** (migration from SQLite completed in commit `2ae8436`). Schema source of truth: [`server/src/db/schema.ts`](server/src/db/schema.ts) (using `drizzle-orm/pg-core` `pgTable`). Migrations are generated by Drizzle Kit into `server/drizzle/` (SQL + `meta/` snapshots) and applied at boot via `runMigrations()`. The legacy `server/src/db/schema-pg.ts` template is dead code — to be removed.

Generate a new migration after editing the schema: `npx drizzle-kit generate` (writes a new `server/drizzle/0NNN_*.sql` + updates `meta/_journal.json`).

When adding new tables, update `resetTestDatabase()` in `server/src/test-utils/test-db.ts` to include them in the truncation list (test isolation).

## Conventions

- TypeScript strict mode (root `tsconfig.base.json`); 2-space indent, single quotes, semis, trailing commas, 100-char width (Prettier).
- React: `PascalCase` components, `useX` hooks, `camelCase` for everything else.
- Vitest test files: colocated `*.test.ts` next to source in `server/src/`; `shared/tests/` for shared-module tests.
- Tailwind + CSS variables for styling.
- Internationalization: i18next, locales in `client/public/locales/`.

## Environment

Two `.env` files are loaded by the server: the repo-root `.env` first, then `server/.env` overrides on collision. Both are optional — keep secrets in the repo root unless they truly need to differ between dev and the server workspace.

Required-in-production: `JWT_SECRET` and `ENCRYPTION_KEY` (server refuses to boot otherwise — see `config/env.ts`). For password reset emails in production, set either `RESEND_API_KEY` or `PASSWORD_RESET_WEBHOOK_URL` — otherwise `sendPasswordResetEmail` throws at runtime to surface the misconfiguration. At least one LLM provider key is needed for generation to work, but the app boots without one.

For dev auto-login: set `DEV_AUTO_LOGIN_EMAIL` (gated server-side by `NODE_ENV !== 'production'`); the client falls back to `POST /api/auth/dev-login` when `/auth/me` returns 401 in `import.meta.env.DEV`.

## Image publishing & social platforms

Images attached to a post (`generated_images.postId`) are passed to platform adapters as **both** `mediaUrls` (public URLs, used by Facebook/Instagram/Pinterest) and `mediaFiles` (raw bytes, used by LinkedIn/Twitter for multipart upload). The plumbing lives in `services/posts/index.ts`; per-platform attach logic in each `services/platforms/*.ts`.

Two operational prereqs to make image publishing actually work end-to-end:

1. **`BASE_URL` must be HTTPS and externally resolvable.** Facebook/Pinterest/Instagram fetch the URL server-side; `localhost:3001` is unreachable. Use ngrok/cloudflared in dev.
2. **Twitter requires the `media.write` scope.** Connections issued before this scope was added must be re-authorized — disconnect/reconnect from Settings.

OAuth tokens are refreshed proactively via `ensureFreshToken` (`services/platforms/index.ts`) before any adapter call, when `tokenExpires` is within 5 minutes. If refresh fails, the call still proceeds with the old token to surface a clear 401 for the user.
