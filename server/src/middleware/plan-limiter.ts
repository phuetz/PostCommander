import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@postcommander/shared';
import { getDb } from '../db/connection.js';
import { PLANS } from '../services/stripe/plans.js';
import type { PlanId } from '../services/stripe/plans.js';
import type { UserRow } from '../types/database.js';
import { requireRequestUser } from '../utils/request-user.js';

/**
 * Feature gates by plan. Each plan has access to a set of feature keys.
 */
const FEATURE_GATES: Record<string, PlanId[]> = {
  // Free features
  generate: ['free', 'pro', 'business'],
  basic_templates: ['free', 'pro', 'business'],

  // Pro features
  viral_library: ['pro', 'business'],
  hooks: ['pro', 'business'],
  carousel: ['pro', 'business'],
  templates: ['pro', 'business'],
  repurpose: ['pro', 'business'],
  hashtags: ['pro', 'business'],
  styles: ['pro', 'business'],
  ab_testing: ['pro', 'business'],
  engagement: ['pro', 'business'],
  trending: ['pro', 'business'],

  // Business features
  images: ['business'],
  pillars: ['business'],
  simulator: ['business'],
  analytics: ['business'],
  api_access: ['business'],
  team_members: ['business'],
};

/**
 * Get the user record from the database, resetting monthly usage if needed.
 */
function getUser(userId: string): UserRow | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;

  if (!user) return null;

  // Check if posts_reset_date has passed and reset counter
  if (user.posts_reset_date && new Date(user.posts_reset_date) <= new Date()) {
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    db.prepare(
      "UPDATE users SET posts_used_this_month = 0, posts_reset_date = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(nextReset, user.id);
    user.posts_used_this_month = 0;
    user.posts_reset_date = nextReset;
  }

  return user;
}

/**
 * Middleware that checks if the user has remaining posts this month.
 * For free plan users, this enforces the 10 posts/month limit.
 * For paid plan users, posts are unlimited (-1).
 *
 * Also increments the post counter after allowing through.
 */
export function checkPostLimit() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestUser = requireRequestUser(req);
    const user = getUser(requestUser.id);

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized',
      };
      res.status(401).json(response);
      return;
    }

    const plan = PLANS[user.plan as PlanId] || PLANS.free;
    const limit = plan.postsPerMonth;

    // -1 means unlimited
    if (limit === -1) {
      next();
      return;
    }

    const used = user.posts_used_this_month || 0;
    if (used >= limit) {
      const response: ApiResponse = {
        success: false,
        error: `You've reached your monthly limit of ${limit} posts on the ${plan.name} plan. Upgrade to Pro or Business for unlimited posts.`,
      };
      res.status(403).json(response);
      return;
    }

    // Increment usage counter after the request is processed successfully
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const db = getDb();
        db.prepare(
          "UPDATE users SET posts_used_this_month = posts_used_this_month + 1, updated_at = datetime('now') WHERE id = ?",
        ).run(user.id);
      }
    });

    next();
  };
}

/**
 * Middleware factory that checks if the user's plan includes a specific feature.
 * @param feature The feature key to check (e.g., 'viral_library', 'images').
 */
export function requireFeature(feature: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestUser = requireRequestUser(req);
    const userPlan: PlanId = requestUser.plan;

    const allowedPlans = FEATURE_GATES[feature];

    // If feature is not gated, allow through
    if (!allowedPlans) {
      next();
      return;
    }

    if (!allowedPlans.includes(userPlan)) {
      const planConfig = PLANS[userPlan as keyof typeof PLANS] || PLANS.free;
      const requiredPlan = allowedPlans[0] === 'pro' ? 'Pro' : 'Business';

      const response: ApiResponse = {
        success: false,
        error: `The "${feature.replace(/_/g, ' ')}" feature requires the ${requiredPlan} plan or higher. You're currently on the ${planConfig.name} plan.`,
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
}
