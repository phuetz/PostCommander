# Architecture Decision Records

Lightweight ADRs documenting the foundational architectural choices in PostCommander. New ADRs are numbered sequentially and live alongside the affected code.

## Index

| # | Title | Status |
|---|---|---|
| [0001](./0001-postgres-over-sqlite.md) | Migrate from SQLite to PostgreSQL | Accepted |
| [0002](./0002-bullmq-for-background-jobs.md) | BullMQ for background jobs | Accepted |
| [0003](./0003-vercel-ai-sdk-llm-abstraction.md) | Vercel AI SDK as LLM provider abstraction | Accepted |
| [0004](./0004-stagehand-for-browser-automation.md) | Stagehand (Browserbase) for outreach browser automation | Accepted (with caveats) |
| [0005](./0005-multi-tenant-via-workspaces.md) | Multi-tenant via Workspaces (per-user scoping by default) | Accepted |

## When to write an ADR

- A new dependency that introduces operational surface (a DB, a worker engine, a SaaS).
- A design that locks you in (data model, multi-tenant strategy, auth scheme).
- A tradeoff that future readers will inevitably question ("why X over Y?").

Not necessary for : library choice for a single utility, bug fixes, refactors that preserve external behavior.

## Format

Keep ADRs short (1-2 pages). Sections :
- **Status** : Proposed / Accepted / Superseded by [N]
- **Context** : the problem and constraints
- **Decision** : the chosen path
- **Consequences** : positive + negative + neutral
- **Alternatives considered** : 2-3 with one-line rationales
- **References** : code / docs / commits
