# ADR 0005 — Multi-tenant via Workspaces (per-user scoping by default)

**Status** : Accepted  
**Deciders** : Platform team

## Context

PostCommander started as a single-user tool. Demand for team / agency use cases triggered a multi-tenant requirement :
- A user can belong to multiple workspaces (their personal one + agency workspaces)
- Workspaces own posts, platform connections, automations, ideas — not users
- An agency admin can see their members' activity but not data from other workspaces

Two extreme designs were rejected :
- **Pure single-tenant** : separate DB / instance per customer. Operationally expensive for SMB pricing.
- **Pure row-level security at the DB layer** : Postgres RLS works but requires every query to set `SET LOCAL app.current_user_id` ; a missing `SET` silently leaks data.

## Decision

**Application-level scoping** anchored on two columns on every tenant-owned table :

- `user_id` (always required, references `users.id` ON DELETE CASCADE)
- `workspace_id` (optional ; set when the row belongs to a workspace context, references `workspaces.id` ON DELETE CASCADE)

Plus :
- The `authMiddleware` (`server/src/middleware/auth.ts`) reads the JWT, loads the user, then if the request carries `X-Workspace-Id` AND the user is a member (`workspaceMembers` lookup), sets `req.workspaceId`. Non-membership → 403 explicit (audit batch 5 A1 fix).
- Every Drizzle query that reads tenant-owned data MUST filter by `eq(table.userId, req.user.id)` (and `eq(table.workspaceId, req.workspaceId)` where applicable).
- Per-route Zod schemas are `.strict()` so the body can't forge `userId` / `workspaceId`.

## Consequences

**Positive** :
- Explicit at every callsite — code review catches missing scoping immediately (the filter is visible).
- Works in any RDBMS without RLS features.
- Migration `006_user_scoping.sql` added `user_id` to legacy tables when the feature shipped.
- 16 unit + integration tests guard the boundary (workspace-non-member → 403, IDOR on `/posts/:id` → 404 when not owned).

**Negative** :
- Risk of forgetting the filter on a new query : mitigated by the audit (dim 1, R4) which scans every route+controller and the Zod coverage script.
- No "share a single post" cross-workspace feature without explicit re-design.
- Admin-tier queries (DB-wide aggregates) bypass scoping and must be in `admin.controller.ts` behind `requireAdmin`.

## Membership model

```
users                  workspace_members          workspaces
+--id (PK)             +--workspace_id (FK)       +--id (PK)
+--email               +--user_id (FK)            +--name
+--role (admin|user)   +--role (owner|admin|...)  +--owner_id (FK→users.id)
```

A user always has at least 1 workspace (their personal one, auto-created at signup). Adding to a workspace = inserting a `workspace_members` row.

## Future evolution

- **Row-level security backstop** : layer Postgres RLS on top of the app-level scoping as defense in depth. Tracked.
- **Resource sharing** : currently nope ; the existing model could extend via a `post_shares` join table without touching scoping.

## References

- `migration 006_user_scoping.sql` : historical context for the column additions
- `server/src/middleware/auth.ts` : workspace membership check
- `server/src/schemas/routes.ts` + per-route schemas : `.strict()` blocks `userId` forging via body
- Audit dim 1 (A1, A6) + dim 2 (V4 mass-assignment)
