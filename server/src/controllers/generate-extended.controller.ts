import type { Request, Response } from 'express';
import {
  type ApiResponse,
  hooksSchema,
  carouselSchema,
  repurposeSchema,
  hashtagsSchema,
} from '@postcommander/shared';
import { catchAsync } from '../utils/catch-async.js';
import { generateHooks } from '../services/llm/hooks.js';
import { generateCarousel } from '../services/llm/carousel.js';
import { repurposePost } from '../services/llm/repurpose.js';
import { researchHashtags } from '../services/llm/hashtags.js';
import { requireRequestUser } from '../utils/request-user.js';
import { generateCacheKey, getFromCache, setInCache } from '../utils/cache.js';

// Re-export schemas for backward compatibility if needed,
// though they should be imported from @postcommander/shared now.
export { hooksSchema, carouselSchema, repurposeSchema, hashtagsSchema };

/**
 * POST /api/generate/hooks
 */
export const handleGenerateHooks = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  
  const cacheKey = generateCacheKey('hooks', req.body);
  let result = await getFromCache<any>(cacheKey);

  if (!result) {
    result = await generateHooks(req.body, requestUser.id);
    await setInCache(cacheKey, result, 86400 * 7); // Cache for 7 days
  }

  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
  };
  res.json(response);
});

/**
 * POST /api/generate/carousel
 */
export const handleGenerateCarousel = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);

  const cacheKey = generateCacheKey('carousel', req.body);
  let result = await getFromCache<any>(cacheKey);

  if (!result) {
    result = await generateCarousel(req.body, requestUser.id);
    await setInCache(cacheKey, result, 86400 * 7); // Cache for 7 days
  }

  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
  };
  res.json(response);
});

/**
 * POST /api/generate/repurpose
 */
export const handleRepurpose = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);

  const cacheKey = generateCacheKey('repurpose', req.body);
  let result = await getFromCache<any>(cacheKey);

  if (!result) {
    result = await repurposePost(req.body, requestUser.id);
    await setInCache(cacheKey, result, 86400 * 7);
  }

  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
  };
  res.json(response);
});

/**
 * POST /api/generate/hashtags
 */
export const handleResearchHashtags = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);

  const cacheKey = generateCacheKey('hashtags', req.body);
  let result = await getFromCache<any>(cacheKey);

  if (!result) {
    result = await researchHashtags(req.body, requestUser.id);
    await setInCache(cacheKey, result, 86400 * 7);
  }

  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
  };
  res.json(response);
});
