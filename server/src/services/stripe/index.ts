import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDrizzle } from '../../db/connection.js';
import {
  users as usersTable,
  subscriptions as subscriptionsTable,
  invoices as invoicesTable,
} from '../../db/schema.js';
import { getStripePriceId, planFromPriceId } from './plans.js';
import type { PaidPlanId, BillingInterval } from './plans.js';

// ── Stripe instance ──────────────────────────────────────────────
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set. Configure it in your .env file.');
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return stripeInstance;
}

// ── User helpers ──────────────────────────────────────────────────

/**
 * Ensure a user record exists for the given email, returning the user row.
 */
export async function getOrCreateUser(email: string, name?: string): Promise<any> {
  const db = getDrizzle();
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const resetDate = getNextResetDate();

    await db.insert(usersTable).values({
      id,
      email,
      name: name || null,
      plan: 'free',
      planStatus: 'active',
      postsUsedThisMonth: 0,
      postsResetDate: resetDate,
      createdAt: now,
      updatedAt: now,
    });

    [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  }
  return user;
}

function getNextResetDate(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString();
}

// ── Customer management ──────────────────────────────────────────

/**
 * Get or create a Stripe customer for the given email.
 */
export async function getOrCreateCustomer(email: string, name?: string): Promise<string> {
  const stripe = getStripe();
  const user = await getOrCreateUser(email, name);

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Search Stripe for existing customer with this email
  const existing = await stripe.customers.list({ email, limit: 1 });
  let customerId: string;

  if (existing.data.length > 0) {
    customerId = existing.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  // Link to user record
  const db = getDrizzle();
  await db
    .update(usersTable)
    .set({ stripeCustomerId: customerId, updatedAt: new Date().toISOString() })
    .where(eq(usersTable.id, user.id));

  return customerId;
}

/**
 * Get Stripe customer details.
 */
export async function getCustomer(stripeCustomerId: string): Promise<Stripe.Customer> {
  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  if (customer.deleted) {
    throw new Error('Customer has been deleted in Stripe.');
  }
  return customer as Stripe.Customer;
}

// ── Session management ───────────────────────────────────────────

/**
 * Create a Stripe checkout session for a subscription.
 */
export async function createCheckoutSession(
  email: string,
  plan: PaidPlanId,
  interval: BillingInterval,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const customerId = await getOrCreateCustomer(email);
  const priceId = getStripePriceId(plan, interval);

  if (!priceId) {
    throw new Error(`No price ID found for plan ${plan} and interval ${interval}`);
  }

  const user = await getOrCreateUser(email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: user.id,
      plan,
      interval,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        plan,
        interval,
      },
    },
  });

  return session.url!;
}

/**
 * Create a Stripe customer portal session.
 */
export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

// ── Subscription management ──────────────────────────────────────

/**
 * Cancel a subscription in Stripe at period end.
 */
export async function cancelSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a subscription that was set to cancel at period end.
 */
export async function resumeSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function cancelSubscriptionImmediately(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.cancel(stripeSubscriptionId);
}

/**
 * Get or create a user by email, specifically for API/Webhook contexts.
 */
export async function getUserByEmail(email: string): Promise<any> {
  const db = getDrizzle();
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    user = await getOrCreateUser(email);
  }
  return user;
}

/**
 * Handle subscription updated/created.
 */
export async function syncSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripe();
  const db = getDrizzle();

  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const stripeCustomerId = sub.customer as string;

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, stripeCustomerId))
    .limit(1);
  if (!user) return;

  const [existingSub] = await db
    .select({ id: subscriptionsTable.id })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  const status = sub.status;
  const priceId = sub.items.data[0]?.price?.id || '';
  const planInfo = planFromPriceId(priceId);
  const periodStart = new Date(sub.current_period_start * 1000).toISOString();
  const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
  const cancelAtPeriodEnd = sub.cancel_at_period_end ? 1 : 0;
  const canceledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null;

  if (existingSub) {
    const updates: any = {
      status,
      stripePriceId: priceId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
      canceledAt,
      updatedAt: new Date().toISOString(),
    };
    if (planInfo) {
      updates.plan = planInfo.plan;
      updates.interval = planInfo.interval;
    }
    await db
      .update(subscriptionsTable)
      .set(updates)
      .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubscriptionId));
  } else if (planInfo) {
    await db.insert(subscriptionsTable).values({
      id: randomUUID(),
      userId: user.id,
      stripeSubscriptionId,
      stripePriceId: priceId,
      plan: planInfo.plan,
      interval: planInfo.interval,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

// ── Webhook event handlers ───────────────────────────────────────

/**
 * Construct a Stripe webhook event and verify its signature.
 */
export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set.');
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Route Stripe webhook events to their respective handlers.
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const db = getDrizzle();

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(db, event.data.object as Stripe.Checkout.Session);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(db, event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(db, event.data.object as Stripe.Subscription);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(db, event.data.object as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(db, event.data.object as Stripe.Invoice);
      break;
  }
}

async function handleCheckoutCompleted(db: any, session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as PaidPlanId | undefined;
  const interval = session.metadata?.interval as BillingInterval | undefined;
  const stripeSubscriptionId = session.subscription as string | null;
  const stripeCustomerId = session.customer as string | null;

  if (!userId || !plan || !interval || !stripeSubscriptionId) {
    console.error('Checkout session missing metadata:', {
      userId,
      plan,
      interval,
      stripeSubscriptionId,
    });
    return;
  }

  // Fetch the full subscription to get period info
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const priceId = sub.items.data[0]?.price?.id || '';

  // Update user plan
  await db
    .update(usersTable)
    .set({
      plan,
      planStatus: 'active',
      stripeCustomerId: stripeCustomerId, // Drizzle handles NULL vs existing value well with standard sets
      postsUsedThisMonth: 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(usersTable.id, userId));

  // Upsert subscription record
  const [existingSub] = await db
    .select({ id: subscriptionsTable.id })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (existingSub) {
    await db
      .update(subscriptionsTable)
      .set({
        plan,
        interval,
        status: sub.status,
        stripePriceId: priceId,
        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: 0,
        canceledAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubscriptionId));
  } else {
    await db.insert(subscriptionsTable).values({
      id: randomUUID(),
      userId,
      stripeSubscriptionId,
      stripePriceId: priceId,
      plan,
      interval,
      status: sub.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  console.log(`Checkout completed: user=${userId} plan=${plan} interval=${interval}`);
}

async function handleSubscriptionUpdated(
  db: any,
  subscription: Stripe.Subscription,
): Promise<void> {
  const stripeSubId = subscription.id;
  const status = subscription.status;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end ? 1 : 0;
  const canceledAt = subscription.canceled_at
    ? new Date(subscription.canceled_at * 1000).toISOString()
    : null;
  const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const priceId = subscription.items.data[0]?.price?.id || '';

  // Determine plan from price ID
  const planInfo = planFromPriceId(priceId);

  // Update subscription record
  const [existingSub] = await db
    .select({ id: subscriptionsTable.id, userId: subscriptionsTable.userId })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId))
    .limit(1);

  if (existingSub) {
    const updates: any = {
      status,
      stripePriceId: priceId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
      canceledAt,
      updatedAt: new Date().toISOString(),
    };
    if (planInfo) {
      updates.plan = planInfo.plan;
      updates.interval = planInfo.interval;
    }
    await db
      .update(subscriptionsTable)
      .set(updates)
      .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId));

    // Update user plan status
    const planStatus =
      status === 'active'
        ? 'active'
        : status === 'past_due'
          ? 'past_due'
          : status === 'canceled'
            ? 'canceled'
            : status === 'trialing'
              ? 'trialing'
              : 'active';

    const userUpdates: any = {
      planStatus,
      updatedAt: new Date().toISOString(),
    };
    if (planInfo) {
      userUpdates.plan = planInfo.plan;
    }

    await db.update(usersTable).set(userUpdates).where(eq(usersTable.id, existingSub.userId));
  }

  console.log(`Subscription updated: ${stripeSubId} status=${status}`);
}

async function handleSubscriptionDeleted(
  db: any,
  subscription: Stripe.Subscription,
): Promise<void> {
  const stripeSubId = subscription.id;

  const [existingSub] = await db
    .select({ id: subscriptionsTable.id, userId: subscriptionsTable.userId })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId))
    .limit(1);

  if (existingSub) {
    // Mark subscription as canceled
    await db
      .update(subscriptionsTable)
      .set({
        status: 'canceled',
        canceledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId));

    // Downgrade user to free
    await db
      .update(usersTable)
      .set({
        plan: 'free',
        planStatus: 'active',
        postsUsedThisMonth: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(usersTable.id, existingSub.userId));

    console.log(
      `Subscription deleted: ${stripeSubId} - user ${existingSub.userId} downgraded to free`,
    );
  }
}

async function handleInvoicePaid(db: any, invoice: Stripe.Invoice): Promise<void> {
  const stripeInvoiceId = invoice.id;
  if (!stripeInvoiceId) return;

  const stripeCustomerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!stripeCustomerId) return;

  // Find user by stripe customer id
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, stripeCustomerId))
    .limit(1);
  if (!user) {
    console.error(`Invoice paid but no user found for customer: ${stripeCustomerId}`);
    return;
  }

  // Avoid duplicates
  const [existing] = await db
    .select({ id: invoicesTable.id })
    .from(invoicesTable)
    .where(eq(invoicesTable.stripeInvoiceId, stripeInvoiceId))
    .limit(1);
  if (existing) return;

  await db.insert(invoicesTable).values({
    id: randomUUID(),
    userId: user.id,
    stripeInvoiceId,
    amount: invoice.amount_paid || 0,
    currency: invoice.currency || 'eur',
    status: 'paid',
    invoiceUrl: invoice.hosted_invoice_url || null,
    invoicePdf: invoice.invoice_pdf || null,
    createdAt: new Date().toISOString(),
  });

  console.log(`Invoice paid: ${stripeInvoiceId} amount=${invoice.amount_paid}`);
}

async function handleInvoicePaymentFailed(db: any, invoice: Stripe.Invoice): Promise<void> {
  const stripeCustomerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!stripeCustomerId) return;

  // Find user and mark as past_due
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.stripeCustomerId, stripeCustomerId))
    .limit(1);
  if (!user) return;

  await db
    .update(usersTable)
    .set({ planStatus: 'past_due', updatedAt: new Date().toISOString() })
    .where(eq(usersTable.id, user.id));

  console.log(`Invoice payment failed for user: ${user.id}`);
}

export { getStripe };
