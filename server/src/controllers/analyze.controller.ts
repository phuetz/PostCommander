import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catch-async.js';
import { predictEngagement } from '../services/llm/engagement.js';
import { simulatePerformance } from '../services/llm/simulator.js';
import { requireRequestUser } from '../utils/request-user.js';
import { generateCacheKey, getFromCache, setInCache } from '../utils/cache.js';

/**
 * POST /api/analyze/engagement
 */
export const handleEngagement = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);

  const cacheKey = generateCacheKey('engagement', req.body);
  let result = await getFromCache<any>(cacheKey);

  if (!result) {
    result = await predictEngagement(req.body, requestUser.id);
    await setInCache(cacheKey, result, 86400 * 7);
  }

  res.json({ success: true, data: result });
});

/**
 * POST /api/analyze/simulate
 */
export const handleSimulate = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);

  const cacheKey = generateCacheKey('simulate', req.body);
  let result = await getFromCache<any>(cacheKey);

  if (!result) {
    result = await simulatePerformance(req.body, requestUser.id);
    await setInCache(cacheKey, result, 86400 * 7);
  }

  res.json({ success: true, data: result });
});
