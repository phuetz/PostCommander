import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDrizzle } from '../db/connection.js';
import { invoices as invoicesTable, subscriptions as subscriptionsTable } from '../db/schema.js';
import {
  closeTestDatabase,
  createAuthCookie,
  createTestUser,
  initTestDatabase,
  resetTestDatabase,
} from '../test-utils/test-db.js';

describe('Admin support routes', () => {
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

  it('rejects non-admin users from deleted account archives', async () => {
    const user = await createTestUser({ email: 'member@example.com', role: 'user' });

    const response = await request(app)
      .get('/api/admin/deleted-accounts')
      .set('Cookie', createAuthCookie(user.id));

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Admin access required');
  });

  it('allows admins to search deleted account archives by raw email', async () => {
    const db = getDrizzle();
    const admin = await createTestUser({ email: 'admin@example.com', role: 'admin' });
    const deletedUser = await createTestUser({
      email: 'deleted@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      plan: 'pro',
      planStatus: 'active',
      stripeCustomerId: 'cus_deleted_123',
    });
    const now = new Date().toISOString();

    await db.insert(subscriptionsTable).values({
      id: crypto.randomUUID(),
      userId: deletedUser.id,
      stripeSubscriptionId: 'sub_deleted_123',
      stripePriceId: 'price_deleted_123',
      plan: 'pro',
      interval: 'month',
      status: 'canceled',
      currentPeriodStart: now,
      currentPeriodEnd: now,
      cancelAtPeriodEnd: 0,
      canceledAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(invoicesTable).values({
      id: crypto.randomUUID(),
      userId: deletedUser.id,
      stripeInvoiceId: 'inv_deleted_123',
      amount: 1900,
      currency: 'eur',
      status: 'paid',
      invoiceUrl: 'https://stripe.test/deleted',
      invoicePdf: null,
      createdAt: now,
    });

    await request(app)
      .delete('/api/auth/account')
      .set('Cookie', createAuthCookie(deletedUser.id))
      .send({
        password: 'password123',
        confirmation: 'DELETE',
      })
      .expect(200);

    const response = await request(app)
      .get('/api/admin/deleted-accounts')
      .query({ email: 'deleted@example.com' })
      .set('Cookie', createAuthCookie(admin.id));

    expect(response.status).toBe(200);
    expect(response.body.data.audits).toHaveLength(1);
    expect(response.body.data.audits[0]).toMatchObject({
      originalUserId: deletedUser.id,
      stripeCustomerId: 'cus_deleted_123',
      plan: 'pro',
    });
    expect(response.body.data.audits[0].snapshot.user.email).toBeUndefined();
    expect(response.body.data.audits[0].snapshot.contentCounts.posts).toBe(0);
    expect(response.body.data.audits[0].billingRecords).toHaveLength(2);
    expect(
      response.body.data.audits[0].billingRecords
        .map((row: { recordType: string }) => row.recordType)
        .sort(),
    ).toEqual(['invoice', 'subscription']);
  });
});
