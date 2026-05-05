import type { Request } from 'express';
import { AppError } from '../middleware/error-handler.js';

export interface RequestUser {
  id: string;
  email: string;
  plan: 'free' | 'pro' | 'business';
  planStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  postsUsedThisMonth: number;
  postsResetDate: string | null;
}

export function requireRequestUser(req: Request): RequestUser {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized');
  }

  return req.user;
}
