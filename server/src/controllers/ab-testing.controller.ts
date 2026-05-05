import type { Request, Response } from 'express';
import { type ApiResponse } from '@postcommander/shared';
import { generateABVariants } from '../services/llm/ab-testing.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';

/**
 * POST /api/generate/ab-test
 */
export const handleABTest = catchAsync(async (
  req: Request,
  res: Response,
) => {
  const requestUser = requireRequestUser(req);
  const result = await generateABVariants(req.body, requestUser.id);

  const response: ApiResponse = {
    success: true,
    data: result,
  };

  res.json(response);
});
