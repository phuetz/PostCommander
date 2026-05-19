import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { closeDb, getDb, getDrizzle, initDb } from '../db/connection.js';
import { users as usersTable } from '../db/schema.js';

export function initTestDatabase() {
  initDb();
}

export function closeTestDatabase() {
  closeDb();
}

/**
 * Test isolation: TRUNCATE CASCADE is meaningfully faster than DELETE across
 * 14 tables (one statement, no per-row overhead, FK cascade handles ordering).
 * RESTART IDENTITY isn't useful here since IDs are uuids.
 *
 * Parallelism note: vitest `fileParallelism: false` is currently REQUIRED
 * because every test file shares this single Postgres DB and calls
 * resetTestDatabase() between tests. To enable parallelism, two options:
 *   (a) Run each test inside `db.transaction()` + force ROLLBACK at the end —
 *       requires the route handler to share the same tx instance (deep refactor).
 *   (b) Give each vitest worker its own Postgres schema via `SET search_path
 *       TO test_w_${VITEST_WORKER_ID}` + run migrations per schema at boot
 *       (medium refactor in initDb + connection pool).
 * Tracked as a chantier in audit/audit-complet-postcommander.md (T5).
 */
export async function resetTestDatabase() {
  const db = getDb();
  // Kept as DELETE (not TRUNCATE CASCADE) — TRUNCATE on the broader table list
  // caused FK-related test failures when run alongside route/controller tests
  // that pre-seed specific fixtures. DELETE in dependency order is slower but
  // predictable. The bigger fileParallelism + transaction-per-test refactor
  // (audit T5) is the proper next step.
  await db.query(`
    DELETE FROM deleted_billing_records;
    DELETE FROM deleted_account_audits;
    DELETE FROM content_ideas;
    DELETE FROM content_pillars;
    DELETE FROM generated_images;
    DELETE FROM writing_styles;
    DELETE FROM post_publications;
    DELETE FROM posts;
    DELETE FROM platform_connections;
    DELETE FROM invoices;
    DELETE FROM subscriptions;
    DELETE FROM password_reset_tokens;
    DELETE FROM settings;
    DELETE FROM users;
  `);
}

export async function createTestUser(
  overrides: Partial<{
    id: string;
    email: string;
    name: string | null;
    role: 'user' | 'admin';
    passwordHash: string | null;
    plan: 'free' | 'pro' | 'business';
    planStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
    postsUsedThisMonth: number;
    postsResetDate: string | null;
    stripeCustomerId: string | null;
  }> = {},
) {
  const db = getDrizzle();
  const now = new Date().toISOString();
  const user = {
    id: overrides.id ?? randomUUID(),
    email: overrides.email ?? `user-${randomUUID()}@example.com`,
    name: overrides.name ?? 'Test User',
    role: overrides.role ?? 'user',
    passwordHash: overrides.passwordHash ?? null,
    avatarUrl: null,
    stripeCustomerId: overrides.stripeCustomerId ?? null,
    plan: overrides.plan ?? 'free',
    planStatus: overrides.planStatus ?? 'active',
    postsUsedThisMonth: overrides.postsUsedThisMonth ?? 0,
    postsResetDate: overrides.postsResetDate ?? null,
    createdAt: now,
    updatedAt: now,
  } as const;

  await db.insert(usersTable).values(user);
  return user;
}

export function createAuthCookie(userId: string): string {
  return `token=${createAuthToken(userId)}`;
}

export function createAuthToken(userId: string): string {
  return jwt.sign({ userId }, config.JWT_SECRET);
}
