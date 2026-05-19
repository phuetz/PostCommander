# ADR 0001 — Migrate from SQLite to PostgreSQL

**Status** : Accepted (commit `2ae8436`, 2026)  
**Deciders** : Platform team  
**Replaces** : original SQLite + WAL setup

## Context

The initial PostCommander stack used SQLite via `better-sqlite3` for development simplicity:
- Zero-install for new developers
- File-based backups (`scripts/backup-db.mjs`)
- Drizzle ORM provided a uniform query layer

By Q1 2026 the limits showed:
- **Concurrent writes** : SQLite serializes writes via a global lock. With BullMQ workers (analytics, publishing, autoblog, outreach, scraper, agent) running concurrently against the same DB, contention caused intermittent `SQLITE_BUSY` errors under load.
- **Connection model** : the server was single-process by necessity (SQLite is process-local). Horizontal scaling required either a sidecar replication layer (litestream) or a true client-server DB.
- **Test parallelism** : `fileParallelism: false` in vitest because all tests shared the same SQLite file — same problem in CI as in dev.
- **Production deployment** : every PaaS (Railway, Render, Fly, Vercel) offers managed Postgres ; SQLite needs a persistent volume per instance which is operationally awkward.

## Decision

Migrate to **PostgreSQL 15+** with Drizzle ORM (`drizzle-orm/pg-core`), keeping:
- The same Drizzle query API (minimal codebase churn — `pgTable` instead of `sqliteTable`)
- The same migration tool (`drizzle-kit`) writing SQL to `server/drizzle/`
- The same `getDb()` (raw `pg.Pool`) + `getDrizzle()` (typed) public API

The `schema.ts` is the source of truth ; migrations live under `server/drizzle/` and are applied at boot via `runMigrations()`.

## Consequences

**Positive** :
- Multi-instance deployment possible (each worker process opens its own pool).
- Better concurrency story for BullMQ workers (Postgres MVCC vs SQLite global lock).
- Type-safe schema-to-runtime alignment via Drizzle Kit.
- Easier prod setup on managed Postgres (Neon, Supabase, Render PG, Fly Postgres).

**Negative** :
- New onboarding step : developers need a local Postgres (docker-compose provides one).
- `db:backup` script (was SQLite online backup) now needs `pg_dump` (chantier audit dim 5/D7).
- Larger memory footprint in dev (Postgres process ~80MB vs SQLite ~5MB).

## Migration debrief

- Performed in a single commit (`2ae8436`).
- `schema.ts` rewritten with `pgTable` / `text` / `timestamp` / `index` / `uniqueIndex`.
- `server/src/db/migrations/` (legacy SQL files) emptied ; new migrations under `server/drizzle/0NNN_*.sql`.
- `schema-pg.ts` (the old template) is dead code, removed in batch 5.

## Alternatives considered

- **Stay on SQLite + litestream** : zero migration cost, single-binary deploy. Rejected because workers still bottleneck on the global write lock.
- **MySQL** : equivalent capability, but team familiarity with Postgres made it the simpler call.
- **CockroachDB / DuckDB** : overkill for the workload.

## References

- Drizzle `pgTable` docs : <https://orm.drizzle.team/docs/sql-schema-declaration#postgresql-table>
- BullMQ + Postgres patterns : <https://docs.bullmq.io/>
- Audit dim 5 (D1) flagged the documentation drift (CLAUDE.md said SQLite until batch 5)
