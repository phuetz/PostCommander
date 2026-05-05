export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    postsPerMonth: 10,
    aiProviders: 1,
    platforms: 2,
    features: ['basic_tones', 'basic_templates'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    postsPerMonth: -1, // unlimited
    aiProviders: 5,
    platforms: 6,
    features: ['all_tones', 'viral_library', 'hooks', 'carousel', 'templates', 'repurpose', 'hashtags', 'styles', 'ab_testing', 'engagement', 'trending'],
    prices: {
      month: { amount: 1900, currency: 'eur', stripePriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '' },
      year: { amount: 19000, currency: 'eur', stripePriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '' },
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    postsPerMonth: -1, // unlimited
    aiProviders: 5,
    platforms: 6,
    features: [
      'all_pro_features',
      'images',
      'pillars',
      'simulator',
      'analytics',
      'calendar_scheduling',
      'direct_publishing',
      'account_export',
    ],
    prices: {
      month: { amount: 4900, currency: 'eur', stripePriceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || '' },
      year: { amount: 49000, currency: 'eur', stripePriceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '' },
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type PaidPlanId = 'pro' | 'business';
export type BillingInterval = 'month' | 'year';

/**
 * Get the Stripe price ID for a given plan and billing interval.
 */
export function getStripePriceId(plan: PaidPlanId, interval: BillingInterval): string {
  const planConfig = PLANS[plan];
  if (!planConfig.prices) {
    throw new Error(`Plan "${plan}" does not have prices configured.`);
  }
  const priceId = planConfig.prices[interval].stripePriceId;
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for ${plan}/${interval}. Set the STRIPE_*_PRICE_ID env vars.`);
  }
  return priceId;
}

/**
 * Determine which plan a Stripe price ID belongs to.
 */
export function planFromPriceId(priceId: string): { plan: PaidPlanId; interval: BillingInterval } | null {
  for (const planId of ['pro', 'business'] as const) {
    const planConfig = PLANS[planId];
    if (planConfig.prices.month.stripePriceId === priceId) {
      return { plan: planId, interval: 'month' };
    }
    if (planConfig.prices.year.stripePriceId === priceId) {
      return { plan: planId, interval: 'year' };
    }
  }
  return null;
}

/**
 * Get public-safe plan info (no Stripe IDs).
 */
export function getPublicPlans() {
  return Object.entries(PLANS).map(([id, plan]) => ({
    id,
    name: plan.name,
    postsPerMonth: plan.postsPerMonth,
    aiProviders: plan.aiProviders,
    platforms: plan.platforms,
    features: plan.features,
    ...('prices' in plan
      ? {
          prices: {
            month: { amount: plan.prices.month.amount, currency: plan.prices.month.currency },
            year: { amount: plan.prices.year.amount, currency: plan.prices.year.currency },
          },
        }
      : {}),
  }));
}
