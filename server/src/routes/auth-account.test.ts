import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from '../app.js';
import { getDrizzle } from '../db/connection.js';
import {
  deletedAccountAudits as deletedAccountAuditsTable,
  deletedBillingRecords as deletedBillingRecordsTable,
  platformConnections as platformConnectionsTable,
  posts as postsTable,
  settings as settingsTable,
  subscriptions as subscriptionsTable,
  invoices as invoicesTable,
  users as usersTable,
} from '../db/schema.js';
import { encryptSecret } from '../utils/secret-crypto.js';
import {
  closeTestDatabase,
  createAuthCookie,
  createTestUser,
  initTestDatabase,
  resetTestDatabase,
} from '../test-utils/test-db.js';

describe('Account data routes', () => {
  const app = createApp();

  beforeAll(() => {
    initTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  beforeEach(() => {
    resetTestDatabase();
  });

  it('exports only the authenticated account data as a JSON attachment', async () => {
    const db = getDrizzle();
    const userA = await createTestUser({ email: 'alice@example.com' });
    const userB = await createTestUser({ email: 'bob@example.com' });
    const now = new Date().toISOString();

    await db.insert(settingsTable).values([
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        key: 'defaultTone',
        value: 'casual',
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        key: 'openaiApiKey',
        value: encryptSecret('sk-alice-secret-1234'),
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        userId: userB.id,
        key: 'defaultTone',
        value: 'professional',
        updatedAt: now,
      },
    ]);

    await db.insert(platformConnectionsTable).values([
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        platform: 'linkedin',
        accountName: 'Alice on LinkedIn',
        accessToken: encryptSecret('access-token-a'),
        refreshToken: encryptSecret('refresh-token-a'),
        tokenExpires: now,
        scopes: 'w_member_social',
        metadata: '{"aud":"alice"}',
        connectedAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        userId: userB.id,
        platform: 'twitter',
        accountName: 'Bob on X',
        accessToken: encryptSecret('access-token-b'),
        refreshToken: null,
        tokenExpires: null,
        scopes: null,
        metadata: null,
        connectedAt: now,
        updatedAt: now,
      },
    ]);

    const response = await request(app)
      .get('/api/auth/export')
      .set('Cookie', createAuthCookie(userA.id));

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.headers['content-disposition']).toContain('attachment; filename=');
    expect(response.body.user.id).toBe(userA.id);
    expect(response.body.settings.defaultTone).toBe('casual');
    expect(response.body.settings.openaiApiKey).toBe('sk-alice-secret-1234');
    expect(response.body.platformConnections).toHaveLength(1);
    expect(response.body.platformConnections[0]).toMatchObject({
      platform: 'linkedin',
      accountName: 'Alice on LinkedIn',
    });
    expect(response.body.platformConnections[0]).not.toHaveProperty('accessToken');
    expect(response.body.notes).toContain(
      'Sensitive platform access tokens are excluded from exports for security reasons.',
    );
  });

  it('deletes the authenticated account and its active data after password confirmation', async () => {
    const db = getDrizzle();
    const password = 'correct horse battery staple';
    const userA = await createTestUser({
      email: 'alice@example.com',
      passwordHash: await bcrypt.hash(password, 10),
    });
    const userB = await createTestUser({ email: 'bob@example.com' });
    const now = new Date().toISOString();

    await db.insert(postsTable).values([
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        content: 'Alice post',
        originalPrompt: 'Prompt A',
        tone: 'casual',
        llmProvider: 'openai',
        llmModel: 'gpt-4.1-mini',
        platforms: '["linkedin"]',
        platformVariants: null,
        hashtags: '["#alice"]',
        status: 'draft',
        scheduledAt: null,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        userId: userB.id,
        content: 'Bob post',
        originalPrompt: 'Prompt B',
        tone: 'professional',
        llmProvider: 'openai',
        llmModel: 'gpt-4.1-mini',
        platforms: '["linkedin"]',
        platformVariants: null,
        hashtags: '["#bob"]',
        status: 'draft',
        scheduledAt: null,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await db.insert(subscriptionsTable).values({
      id: crypto.randomUUID(),
      userId: userA.id,
      stripeSubscriptionId: 'sub_archived_alice',
      stripePriceId: 'price_archived_alice',
      plan: 'pro',
      interval: 'month',
      status: 'canceled',
      currentPeriodStart: now,
      currentPeriodEnd: now,
      cancelAtPeriodEnd: false,
      canceledAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(invoicesTable).values({
      id: crypto.randomUUID(),
      userId: userA.id,
      stripeInvoiceId: 'inv_archived_alice',
      amount: 1900,
      currency: 'eur',
      status: 'paid',
      invoiceUrl: 'https://stripe.test/alice',
      invoicePdf: null,
      createdAt: now,
    });

    const response = await request(app)
      .delete('/api/auth/account')
      .set('Cookie', createAuthCookie(userA.id))
      .send({
        password,
        confirmation: 'DELETE',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBe('Account deleted successfully');
    expect(response.headers['set-cookie'][0]).toContain('token=;');

    const deletedUser = await db.select().from(usersTable).where(eq(usersTable.id, userA.id));
    const remainingUsers = await db.select().from(usersTable).where(eq(usersTable.id, userB.id));
    const remainingPosts = await db.select().from(postsTable);
    const archivedAccounts = await db.select().from(deletedAccountAuditsTable);
    const archivedBillingRecords = await db.select().from(deletedBillingRecordsTable);

    expect(deletedUser).toHaveLength(0);
    expect(remainingUsers).toHaveLength(1);
    expect(remainingPosts).toHaveLength(1);
    expect(remainingPosts[0].userId).toBe(userB.id);
    expect(archivedAccounts).toHaveLength(1);
    expect(archivedAccounts[0].originalUserId).toBe(userA.id);
    expect(archivedAccounts[0].emailHash).not.toBe('alice@example.com');
    expect(archivedBillingRecords).toHaveLength(2);
    expect(archivedBillingRecords.map((row) => row.recordType).sort()).toEqual([
      'invoice',
      'subscription',
    ]);
  });
});
