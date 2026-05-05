import crypto from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';

const stripeMocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(async () => 'https://stripe.test/checkout'),
  createPortalSession: vi.fn(async () => 'https://stripe.test/portal'),
  cancelSubscription: vi.fn(async () => undefined),
  resumeSubscription: vi.fn(async () => undefined),
}));

vi.mock('../services/stripe/index.js', () => ({
  createCheckoutSession: stripeMocks.createCheckoutSession,
  createPortalSession: stripeMocks.createPortalSession,
  cancelSubscription: stripeMocks.cancelSubscription,
  resumeSubscription: stripeMocks.resumeSubscription,
  constructWebhookEvent: vi.fn(),
  handleWebhookEvent: vi.fn(),
}));

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

describe('Stripe Routes', () => {
  const app = createApp();

  beforeAll(() => {
    initTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetTestDatabase();
  });

  it('requires authentication for subscription details', async () => {
    const response = await request(app).get('/api/stripe/subscription');
    expect(response.status).toBe(401);
  });

  it('uses the authenticated user for checkout instead of request-controlled identity', async () => {
    const user = await createTestUser({ email: 'alice@example.com' });

    const response = await request(app)
      .post('/api/stripe/create-checkout')
      .set('Cookie', createAuthCookie(user.id))
      .send({ plan: 'pro', interval: 'month', email: 'mallory@example.com' });

    expect(response.status).toBe(200);
    expect(stripeMocks.createCheckoutSession).toHaveBeenCalledWith(
      'alice@example.com',
      'pro',
      'month',
      expect.any(String),
      expect.any(String),
    );
  });

  it('returns only the authenticated user subscription and invoices', async () => {
    const db = getDrizzle();
    const userA = await createTestUser({
      email: 'alice@example.com',
      plan: 'pro',
      stripeCustomerId: 'cus_alice',
    });
    const userB = await createTestUser({
      email: 'bob@example.com',
      plan: 'business',
      stripeCustomerId: 'cus_bob',
    });

    await db.insert(subscriptionsTable).values([
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        stripeSubscriptionId: 'sub_alice',
        stripePriceId: 'price_alice',
        plan: 'pro',
        interval: 'month',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
        cancelAtPeriodEnd: 0,
        canceledAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        userId: userB.id,
        stripeSubscriptionId: 'sub_bob',
        stripePriceId: 'price_bob',
        plan: 'business',
        interval: 'year',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
        cancelAtPeriodEnd: 0,
        canceledAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    await db.insert(invoicesTable).values([
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        stripeInvoiceId: 'inv_alice',
        amount: 1900,
        currency: 'eur',
        status: 'paid',
        invoiceUrl: 'https://stripe.test/alice',
        invoicePdf: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        userId: userB.id,
        stripeInvoiceId: 'inv_bob',
        amount: 4900,
        currency: 'eur',
        status: 'paid',
        invoiceUrl: 'https://stripe.test/bob',
        invoicePdf: null,
        createdAt: new Date().toISOString(),
      },
    ]);

    const subscriptionResponse = await request(app)
      .get('/api/stripe/subscription?email=bob@example.com')
      .set('Cookie', createAuthCookie(userA.id));

    expect(subscriptionResponse.status).toBe(200);
    expect(subscriptionResponse.body.data.plan).toBe('pro');
    expect(subscriptionResponse.body.data.subscription.id).toBe('sub_alice');

    const invoicesResponse = await request(app)
      .get('/api/stripe/invoices?email=bob@example.com')
      .set('Cookie', createAuthCookie(userA.id));

    expect(invoicesResponse.status).toBe(200);
    expect(invoicesResponse.body.data.invoices).toHaveLength(1);
    expect(invoicesResponse.body.data.invoices[0].amount).toBe(1900);
    expect(invoicesResponse.body.data.invoices[0].url).toBe('https://stripe.test/alice');
  });

  it('cancels only the authenticated user subscription', async () => {
    const db = getDrizzle();
    const userA = await createTestUser({ email: 'alice@example.com' });
    const userB = await createTestUser({ email: 'bob@example.com' });

    await db.insert(subscriptionsTable).values([
      {
        id: crypto.randomUUID(),
        userId: userA.id,
        stripeSubscriptionId: 'sub_alice',
        stripePriceId: 'price_alice',
        plan: 'pro',
        interval: 'month',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
        cancelAtPeriodEnd: 0,
        canceledAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        userId: userB.id,
        stripeSubscriptionId: 'sub_bob',
        stripePriceId: 'price_bob',
        plan: 'business',
        interval: 'year',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
        cancelAtPeriodEnd: 0,
        canceledAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const response = await request(app)
      .post('/api/stripe/cancel')
      .set('Cookie', createAuthCookie(userA.id))
      .send({ email: 'bob@example.com' });

    expect(response.status).toBe(200);
    expect(stripeMocks.cancelSubscription).toHaveBeenCalledWith('sub_alice');

    const [aliceSub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userA.id));
    const [bobSub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userB.id));

    expect(aliceSub.cancelAtPeriodEnd).toBe(1);
    expect(bobSub.cancelAtPeriodEnd).toBe(0);
  });
});
