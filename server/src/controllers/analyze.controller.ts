import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catch-async.js';
import { predictEngagement } from '../services/llm/engagement.js';
import { simulatePerformance } from '../services/llm/simulator.js';
import { requireRequestUser } from '../utils/request-user.js';

/**
 * POST /api/analyze/engagement
 */
export const handleEngagement = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const result = await predictEngagement(req.body, requestUser.id);
  res.json({ success: true, data: result });
});

/**
 * POST /api/analyze/simulate
 */
export const handleSimulate = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const result = await simulatePerformance(req.body, requestUser.id);
  res.json({ success: true, data: result });
});
