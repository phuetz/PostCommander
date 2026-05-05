import rateLimit, { type Options } from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

/**
 * Per-endpoint rate limits, layered ON TOP of the global 60/min in setup.ts.
 *
 * - Auth bursts (login / forgot-password / register / dev-login):
 *   5 attempts per minute per IP. Stops trivial bruteforce; legitimate users
 *   never hit it.
 *
 * - LLM generation (/api/generate/*):
 *   10 requests per minute keyed on userId (or IP if unauthenticated).
 *   Prevents runaway costs from a single account; the per-plan monthly limit
 *   from plan-limiter.ts still applies on top.
 *
 * Both limiters return JSON shaped like the rest of the API ({ success, error })
 * so the client error toast surfaces a sensible message.
 */

const jsonMessage = (error: string) => ({ success: false, error });

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Block by IP — auth endpoints don't have req.user yet.
  message: jsonMessage('Too many authentication attempts. Try again in a minute.'),
  // Skip in tests so the existing auth.test.ts doesn't trip on bursts.
  skip: () => process.env.NODE_ENV === 'test',
});

const generateKeyGenerator: NonNullable<Options['keyGenerator']> = (req: Request) => {
  // Prefer userId so different users on the same IP don't share a budget.
  const user = (req as Request & { user?: { id: string } }).user;
  if (user?.id) return `u:${user.id}`;
  return req.ip ?? 'anon';
};

export const generateRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKeyGenerator,
  message: jsonMessage('Generation rate limit exceeded. Please slow down.'),
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Adapter-friendly type so consumers can mount these without importing the
 * raw express-rate-limit type.
 */
export type RateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => void;
