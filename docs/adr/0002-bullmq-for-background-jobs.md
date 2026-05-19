# ADR 0002 — BullMQ for background jobs

**Status** : Accepted  
**Deciders** : Platform team

## Context

PostCommander has 6 background workloads :
1. **post-publishing** : honors scheduled posts when their `scheduled_at` is due
2. **analytics-sync** : hourly cron, calls each connected platform's analytics API
3. **auto-blog** : hourly cron, generates LLM articles from configured topics
4. **outreach-campaigns** : every 2h, advances drip sequences via Stagehand / email
5. **agent-workflow** : processes incoming social comments through the LLM agent
6. **scraper-flow** : on-demand execution of flow-builder automations

These jobs vary from ms (publish a single post) to minutes (browser automation, LLM cascade). Requirements :
- **Retry with backoff** on transient platform API failures
- **Cron-style scheduling** for the periodic jobs
- **Concurrency limits per queue** (avoid Browserbase quota / DB saturation)
- **Observability** (bull-board UI, Sentry on final failure)
- **Idempotence** keys to dedupe re-submissions

## Decision

Use **BullMQ** on top of Redis :

- `server/src/services/jobs/queue.ts` declares the 6 queues with `defaultJobOptions` (attempts 3, exponential backoff 5s, retention 1d completed / 7d failed).
- Each worker is its own module in `server/src/workers/*.ts` or `server/src/services/jobs/*.worker.ts`.
- `utils/worker-helpers.ts` exposes `attachWorkerObservability(worker, name)` (Sentry alert on final failure) and `withTimeout(promise, ms, label)` (bound Stagehand calls).
- Repeatable jobs use deterministic `jobId` (e.g. `'analytics-sync-recurring'`) so multi-instance deploys don't double-install.

## Consequences

**Positive** :
- Mature ecosystem (BullMQ is the modern successor to Bull) with first-class TypeScript.
- bull-board UI mounted at `/admin/queues` for ops visibility.
- Per-job retries + backoff out of the box — no custom retry machinery in worker code.
- Workers run in the same Node process as the API server today, but trivially split into a dedicated container (`tsx src/services/jobs/worker.ts`) when scale demands.

**Negative** :
- Requires Redis as a hard dependency (mitigated : managed Redis is ubiquitous on every PaaS).
- BullMQ API deprecations occasionally bite (the older `addRepeatable` / `removeRepeatableByKey` signatures generate TS hints — chantier to migrate to `Job Scheduler` once stable in v5+).
- Adds operational surface : Redis memory must be monitored (covered by `defaultJobOptions.removeOnComplete: { age: 1d, count: 1000 }`).

## Alternatives considered

- **pg-boss** : Postgres-backed jobs, no Redis dependency. Rejected because (a) team familiarity with BullMQ patterns, (b) richer Sentry integration via bull-board, (c) Redis already needed for rate-limiting (`express-rate-limit` MemoryStore unsuitable for multi-instance).
- **Inngest / Temporal** : full workflow engines. Overkill ; PostCommander jobs are stateless one-shots, not multi-step sagas.
- **In-process `setInterval`** : no persistence, no retry, no observability. Not viable past prototype.

## References

- BullMQ docs : <https://docs.bullmq.io/>
- bull-board integration : `server/src/middleware/bull-board.ts`
- Worker resilience patterns : audit dim 6, batch 1+2 (defaultJobOptions, attempts, jobId dedup)
