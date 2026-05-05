import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler.js';
import { getTrendingTopics } from '../services/llm/trending.js';
import { requireRequestUser } from '../utils/request-user.js';

export const trendingSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  industry: z.string().min(1, 'Industry is required'),
  language: z.string().default('English'),
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'ollama']),
  model: z.string().min(1, 'Model is required'),
});

/**
 * POST /api/trending
 */
export async function handleTrending(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const requestUser = requireRequestUser(req);
    const result = await getTrendingTopics(req.body, requestUser.id);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown trending error';
    next(new AppError(500, `Trending topics failed: ${message}`));
  }
}
