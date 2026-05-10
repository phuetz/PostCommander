# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

npm workspaces monorepo with three packages: `client/` (React 19 + Vite), `server/` (Express + TypeScript), `shared/` (types, constants, schemas). The shared package is consumed via `@postcommander/shared` and must be built before downstream packages — the root `build` script enforces this order: `shared → server → client`.

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
npm run db:reset               # delete server/data/ (SQLite + outbox + images)
npm run db:backup              # SQLite online-backup → server/data/backups/ (--keep N, --out DIR)

# Workspace-scoped
npm test -w @postcommander/server                     # all server tests
npm test -w @postcommander/server -- path/to.test.ts  # single file
npm test -w @postcommander/shared
```

There is no client unit-test runner; UI is covered by Playwright e2e under `tests/e2e/`. The Playwright dev server is launched via `scripts/playwright-dev-server.mjs` and uses isolated ports — set `PLAYWRIGHT_REUSE_SERVER=true` to attach to an already-running instance.

## Architecture

### Server boot sequence (`server/src/index.ts` → `app.ts`)

1. `initDb()` opens SQLite at `server/data/postcommander.db`, enables WAL + foreign keys, and runs migrations in `server/src/db/migrations/` in filename order. The `_migrations` table tracks what has been applied. Drizzle ORM is layered on top of `better-sqlite3` and exposed via `getDrizzle()`; raw SQL via `getDb()`.
2. Reference data is seeded (`seedViralPosts`, `seedTemplates`).
3. `./services/jobs/worker.ts` is imported for its side effect — it starts the BullMQ worker that drains the `post-publishing` queue (Redis-backed via `REDIS_URL`).
4. Scheduled workers are started: `startAnalyticsWorker()` (periodic analytics aggregation) and `startEvergreenWorker()` (recurring content recycling).
5. `createApp()` wires Helmet/CORS/rate limiting (`middleware/setup.ts`), cookie parsing, the **Stripe webhook with `express.raw` BEFORE `express.json`** (signature verification depends on the raw body), then JSON body parsing, then `/api` routes.

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

SQL files in `server/src/db/migrations/` are auto-applied on server startup in filename order. Name new files sequentially: `0NN_short_name.sql`. The current schema is mirrored in Drizzle (`server/src/db/schema.ts`) and a Postgres variant exists at `schema-pg.ts` — keep them in sync if you touch the schema.

When adding new tables, update `resetTestDatabase()` in `server/src/test-utils/test-db.ts` to include them in the truncation list (to ensure test isolation). Currently truncates: `deleted_billing_records`, `deleted_account_audits`, `content_ideas`, `content_pillars`, `generated_images`, `writing_styles`, `post_publications`, `posts`, `platform_connections`, `invoices`, `subscriptions`, `password_reset_tokens`, `settings`, `users`.

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
