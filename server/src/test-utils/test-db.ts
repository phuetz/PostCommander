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

export async function resetTestDatabase() {
  const db = getDb();
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
