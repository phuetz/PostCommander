import type { Request, Response } from 'express';
import { eq, desc, and, inArray } from 'drizzle-orm';
import type { ApiResponse } from '@postcommander/shared';
import { getDrizzle } from '../db/connection.js';
import {
  users as usersTable,
  subscriptions as subscriptionsTable,
  invoices as invoicesTable,
} from '../db/schema.js';
import { AppError } from '../middleware/error-handler.js';
import { catchAsync } from '../utils/catch-async.js';
import { logger } from '../utils/logger.js';
import {
  createCheckoutSession,
  createPortalSession,
  cancelSubscription as cancelStripeSub,
  resumeSubscription as resumeStripeSub,
  constructWebhookEvent,
  handleWebhookEvent,
} from '../services/stripe/index.js';
import { PLANS, getPublicPlans } from '../services/stripe/plans.js';
import type { PaidPlanId, BillingInterval, PlanId } from '../services/stripe/plans.js';
import { requireRequestUser } from '../utils/request-user.js';

interface StripeInvoiceView {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  url: string | null;
  pdf: string | null;
}

// ── POST /api/stripe/create-checkout ─────────────────────────────

export const createCheckout = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const { plan, interval } = req.body as {
    plan: PaidPlanId;
    interval: BillingInterval;
  };

  const successUrl =
    process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/app/billing?success=true';
  const cancelUrl = process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/pricing';

  const url = await createCheckoutSession(requestUser.email, plan, interval, successUrl, cancelUrl);

  const response: ApiResponse<{ url: string }> = {
    success: true,
    data: { url },
  };

  res.json(response);
});

// ── POST /api/stripe/create-portal ───────────────────────────────

export const createPortal = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);

  const db = getDrizzle();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, requestUser.id))
    .limit(1);

  if (!user || !user.stripeCustomerId) {
    throw new AppError(404, 'No billing account found for this email. Please subscribe first.');
  }

  const returnUrl = process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/app/billing';

  const url = await createPortalSession(user.stripeCustomerId, returnUrl);

  const response: ApiResponse<{ url: string }> = {
    success: true,
    data: { url },
  };

  res.json(response);
});

// ── GET /api/stripe/subscription ─────────────────────────────────

export const getSubscriptionStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const requestUser = requireRequestUser(req);

    const db = getDrizzle();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, requestUser.id))
      .limit(1);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    // Check if posts_reset_date has passed and reset counter
    if (user.postsResetDate && new Date(user.postsResetDate) <= new Date()) {
      const nextReset = getNextResetDate();
      await db
        .update(usersTable)
        .set({
          postsUsedThisMonth: 0,
          postsResetDate: nextReset,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(usersTable.id, user.id));
      user.postsUsedThisMonth = 0;
      user.postsResetDate = nextReset;
    }

    // Get active subscription if exists
    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, user.id),
          inArray(subscriptionsTable.status, ['active', 'trialing', 'past_due']),
        ),
      )
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    const plan = PLANS[user.plan as PlanId] || PLANS.free;

    const data = {
      plan: user.plan,
      planName: plan.name,
      status: user.planStatus,
      postsUsed: user.postsUsedThisMonth || 0,
      postsLimit: plan.postsPerMonth,
      aiProviders: plan.aiProviders,
      platforms: plan.platforms,
      features: plan.features,
      subscription: subscription
        ? {
            id: subscription.stripeSubscriptionId,
            plan: subscription.plan,
            interval: subscription.interval,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: !!subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt,
          }
        : null,
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    res.json(response);
  },
);

function getNextResetDate(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString();
}

// ── POST /api/stripe/cancel ──────────────────────────────────────

export const cancelUserSubscription = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const requestUser = requireRequestUser(req);

    const db = getDrizzle();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, requestUser.id))
      .limit(1);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, user.id),
          inArray(subscriptionsTable.status, ['active', 'trialing']),
        ),
      )
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    if (!subscription) {
      throw new AppError(404, 'No active subscription found.');
    }

    await cancelStripeSub(subscription.stripeSubscriptionId);

    // Update local record
    await db
      .update(subscriptionsTable)
      .set({ cancelAtPeriodEnd: true, updatedAt: new Date().toISOString() })
      .where(eq(subscriptionsTable.id, subscription.id));

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Subscription will be canceled at the end of the current billing period.' },
    };

    res.json(response);
  },
);

// ── POST /api/stripe/resume ──────────────────────────────────────

export const resumeUserSubscription = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const requestUser = requireRequestUser(req);

    const db = getDrizzle();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, requestUser.id))
      .limit(1);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.userId, user.id),
          eq(subscriptionsTable.cancelAtPeriodEnd, true),
          inArray(subscriptionsTable.status, ['active', 'trialing']),
        ),
      )
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    if (!subscription) {
      throw new AppError(404, 'No subscription pending cancellation found.');
    }

    await resumeStripeSub(subscription.stripeSubscriptionId);

    // Update local record
    await db
      .update(subscriptionsTable)
      .set({ cancelAtPeriodEnd: false, canceledAt: null, updatedAt: new Date().toISOString() })
      .where(eq(subscriptionsTable.id, subscription.id));

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Subscription cancellation has been reversed. Your subscription will continue.',
      },
    };

    res.json(response);
  },
);

// ── POST /api/stripe/webhook ─────────────────────────────────────

export const stripeWebhookHandler = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'] as string | undefined;

    if (!signature) {
      throw new AppError(400, 'Missing stripe-signature header.');
    }

    try {
      const event = constructWebhookEvent(req.body as Buffer, signature);
      await handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown webhook error';
      logger.error({ err }, 'Webhook error');
      throw new AppError(400, `Webhook Error: ${message}`);
    }
  },
);

// ── GET /api/stripe/invoices ─────────────────────────────────────

export const getInvoices = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);

  const db = getDrizzle();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, requestUser.id))
    .limit(1);

  if (!user) {
    const response: ApiResponse<{ invoices: StripeInvoiceView[] }> = {
      success: true,
      data: { invoices: [] },
    };
    res.json(response);
    return;
  }

  const invoices = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.userId, user.id))
    .orderBy(desc(invoicesTable.createdAt))
    .limit(50);

  const formattedInvoices: StripeInvoiceView[] = invoices.map((inv) => ({
    id: inv.id,
    amount: inv.amount,
    currency: inv.currency,
    status: inv.status,
    date: inv.createdAt,
    url: inv.invoiceUrl,
    pdf: inv.invoicePdf,
  }));

  const response: ApiResponse<{ invoices: typeof formattedInvoices }> = {
    success: true,
    data: { invoices: formattedInvoices },
  };

  res.json(response);
});

// ── GET /api/stripe/plans ────────────────────────────────────────

export const getPlansHandler = catchAsync(async (_req: Request, res: Response): Promise<void> => {
  const plans = getPublicPlans();

  const response: ApiResponse<typeof plans> = {
    success: true,
    data: plans,
  };

  res.json(response);
});
