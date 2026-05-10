import type { Request, Response } from 'express';
import { type ApiResponse } from '@postcommander/shared';
import { catchAsync } from '../utils/catch-async.js';
import { getViralPosts, searchViralPosts, getCategories } from '../services/viral/index.js';

/**
 * GET /api/viral
 */
export const listViralPosts = catchAsync(async (req: Request, res: Response) => {
  const query = (req.validatedQuery as
    | { page: number; pageSize: number; platform?: string; category?: string; language?: string }
    | undefined) ?? { page: 1, pageSize: 50 };
  const { posts, total } = await getViralPosts(query);

  const response: ApiResponse<typeof posts> & { total: number; page: number; pageSize: number } = {
    success: true,
    data: posts,
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
  res.json(response);
});

/**
 * GET /api/viral/categories
 */
export const listViralCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await getCategories();
  const response: ApiResponse<typeof categories> = {
    success: true,
    data: categories,
  };
  res.json(response);
});

/**
 * GET /api/viral/search?q=...
 */
export const searchViral = catchAsync(async (req: Request, res: Response) => {
  const query = req.validatedQuery as { q: string };
  const posts = await searchViralPosts(query.q);
  const response: ApiResponse<typeof posts> = {
    success: true,
    data: posts,
  };
  res.json(response);
});
