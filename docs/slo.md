# Service Level Objectives — PostCommander

**Version** : v1 (2026-05-19)  
**Owner** : Platform team  
**Review cadence** : monthly  
**Source of truth** : this file. PRs that knowingly violate a target require a brief note in the description.

These SLOs cover what users care about. They are conservative on purpose — beat them, then tighten.

## Reliability

| SLI | Target | Window | Burn alert threshold | Where to measure |
|---|---|---|---|---|
| API availability (`/api/*` excl. `/health`, `/live`) | **99.5 %** | rolling 30 d | < 99 % over any 1 h | Sentry uptime + nginx/router 5xx ratio |
| Liveness `/api/live` | **99.9 %** | rolling 30 d | any 5xx | external uptime probe (UptimeRobot, BetterStack) |
| Readiness `/api/health` 200 ratio | **99 %** | rolling 7 d | < 95 % over 1 h | external probe |
| Worker job final-failure rate (after `attempts` exhausted) | **< 1 %** | rolling 7 d per queue | > 5 % over 1 h | Sentry alerts via `attachWorkerObservability` |
| Stripe webhook 200 ratio | **100 %** | rolling 7 d | any non-200 | Sentry + Stripe dashboard |

## Latency

| SLI | Target | Where to measure |
|---|---|---|
| `/api/*` p50 (non-stream, non-LLM) | **< 100 ms** | pino-http duration |
| `/api/*` p95 (non-stream, non-LLM) | **< 300 ms** | pino-http duration |
| `/api/*` p99 (non-stream, non-LLM) | **< 1 s** | pino-http duration |
| `/api/generate/*` p95 (LLM) | **< 8 s** (depends on provider) | pino-http duration |
| DB query p95 | **< 50 ms** | `pg_stat_statements` |
| Worker job duration p95 (publishing, analytics) | **< 30 s** | BullMQ `completed` event timing |

## Correctness

| SLI | Target | Notes |
|---|---|---|
| Analytics data freshness lag | **< 90 min** | hourly cron; alert if `lastSyncedAt` > 2 h for `> 5 %` of published publications |
| Duplicate posts published (same post → same platform within 5 min) | **0** | enforced by `idx_post_publications_post_status` + idempotence (W5 fix in progress) |
| Stub data shipped to users | **0** | guarded by `ANALYTICS_FETCH_ENABLED` / `OUTREACH_AUTO_DISCOVERY` flags, default `false` |

## Security

| SLI | Target | Where |
|---|---|---|
| Routes returning 401 due to missing auth that should be authed | **0** | quarterly audit via `audit/pocs/auth/idor-workspace.http` + grep on `routes/*.ts` |
| Validated mutating routes ratio | **≥ 95 %** | `node audit/pocs/injection/zod-coverage.mjs` (last measure 2026-05-19: 64.9 % — work in progress) |
| `npm audit` high+critical | **0** | CI job, fails build (chantier en cours — cf. R2/R3) |
| Secrets in logs | **0** | Pino `redact` + Sentry `beforeSend` ; quarterly grep on prod logs |
| Mean time to revoke a leaked JWT | **< 24 h** | manual rotation of `JWT_SECRET` (chantier : token revocation table) |

## Cost

| SLI | Soft cap | Action |
|---|---|---|
| Sentry traces sample rate | `0.1` (10 %) | env-driven (`SENTRY_TRACES_SAMPLE_RATE`) |
| Sentry profiles sample rate | `0.01` (1 %) | env-driven (`SENTRY_PROFILES_SAMPLE_RATE`) |
| LLM spend per user per month | n/a | tracked via PostHog event `llm.generation` |
| BullMQ Redis memory | < 200 MB | enforced by `defaultJobOptions.removeOnComplete: { age: 1d, count: 1000 }` |

## Error budget policy

- If 30-day availability dips below **99 %** : freeze feature deploys, on-call investigates root cause, post-mortem within 5 business days.
- If worker final-failure rate above **5 %** over 1 h on any production queue : Sentry pages on-call, no auto-replay (manual triage via bull-board admin UI).
- Post-mortem template lives in `docs/post-mortems/_template.md` (to create).

## What's not covered yet

- Per-region latency SLOs (single region deployment for now).
- Per-customer / per-plan SLOs (no enterprise SLA contracts yet).
- Background recompute SLOs (evergreen recycling, autoblog generation cadence) — those are best-effort.

## Changelog

- **v1 — 2026-05-19** : Initial draft from audit recommendations (O8). Reflects state after batches 1-4 of remediation.
