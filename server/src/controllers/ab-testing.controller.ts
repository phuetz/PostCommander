import type { Request, Response } from 'express';
import { type ApiResponse } from '@postcommander/shared';
import { generateABVariants } from '../services/llm/ab-testing.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';
import { generateCacheKey, getFromCache, setInCache } from '../utils/cache.js';

/**
 * POST /api/generate/ab-test
 */
export const handleABTest = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  
  const cacheKey = generateCacheKey('ab-test', req.body);
  let result = await getFromCache<any>(cacheKey);

  if (!result) {
    result = await generateABVariants(req.body, requestUser.id);
    await setInCache(cacheKey, result, 86400 * 7);
  }

  const response: ApiResponse = {
    success: true,
    data: result,
  };

  res.json(response);
});
