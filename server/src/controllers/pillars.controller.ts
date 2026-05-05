import type { Request, Response } from 'express';
import {
  type ApiResponse,
} from '@postcommander/shared';
import { AppError } from '../middleware/error-handler.js';
import { catchAsync } from '../utils/catch-async.js';
import {
  listPillars,
  getPillar,
  createPillar,
  updatePillar,
  deletePillar,
  listIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  generateIdeas,
  getStrategyOverview,
} from '../services/pillars/index.js';
import { requireRequestUser } from '../utils/request-user.js';

// ── Pillar Handlers ──────────────────────────────────────────────────

/**
 * GET /api/pillars
 */
export const handleListPillars = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const pillars = await listPillars(requestUser.id);
  const response: ApiResponse<typeof pillars> = {
    success: true,
    data: pillars,
  };
  res.json(response);
});

/**
 * POST /api/pillars
 */
export const handleCreatePillar = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const pillar = await createPillar(requestUser.id, req.body);
  const response: ApiResponse<typeof pillar> = {
    success: true,
    data: pillar,
  };
  res.status(201).json(response);
});

/**
 * PUT /api/pillars/:id
 */
export const handleUpdatePillar = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const pillar = await updatePillar(requestUser.id, req.params.id as string, req.body);
  if (!pillar) {
    throw new AppError(404, 'Pillar not found');
  }
  const response: ApiResponse<typeof pillar> = {
    success: true,
    data: pillar,
  };
  res.json(response);
});

/**
 * DELETE /api/pillars/:id
 */
export const handleDeletePillar = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const deleted = await deletePillar(requestUser.id, req.params.id as string);
  if (!deleted) {
    throw new AppError(404, 'Pillar not found');
  }
  const response: ApiResponse = {
    success: true,
  };
  res.json(response);
});

// ── Idea Handlers ────────────────────────────────────────────────────

/**
 * GET /api/pillars/:id/ideas
 */
export const handleListIdeas = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const pillar = await getPillar(requestUser.id, req.params.id as string);
  if (!pillar) {
    throw new AppError(404, 'Pillar not found');
  }
  const ideas = await listIdeas(requestUser.id, req.params.id as string);
  const response: ApiResponse<typeof ideas> = {
    success: true,
    data: ideas,
  };
  res.json(response);
});

/**
 * POST /api/pillars/:id/ideas
 */
export const handleCreateIdea = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const pillar = await getPillar(requestUser.id, req.params.id as string);
  if (!pillar) {
    throw new AppError(404, 'Pillar not found');
  }
  const idea = await createIdea(requestUser.id, req.params.id as string, req.body);
  const response: ApiResponse<typeof idea> = {
    success: true,
    data: idea,
  };
  res.status(201).json(response);
});

/**
 * POST /api/pillars/:id/generate-ideas
 */
export const handleGenerateIdeas = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const pillar = await getPillar(requestUser.id, req.params.id as string);
  if (!pillar) {
    throw new AppError(404, 'Pillar not found');
  }
  const ideas = await generateIdeas(requestUser.id, req.params.id as string, req.body);
  const response: ApiResponse<typeof ideas> = {
    success: true,
    data: ideas,
  };
  res.json(response);
});

/**
 * PUT /api/pillars/ideas/:ideaId
 */
export const handleUpdateIdea = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const idea = await updateIdea(requestUser.id, req.params.ideaId as string, req.body);
  if (!idea) {
    throw new AppError(404, 'Idea not found');
  }
  const response: ApiResponse<typeof idea> = {
    success: true,
    data: idea,
  };
  res.json(response);
});

/**
 * DELETE /api/pillars/ideas/:ideaId
 */
export const handleDeleteIdea = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const deleted = await deleteIdea(requestUser.id, req.params.ideaId as string);
  if (!deleted) {
    throw new AppError(404, 'Idea not found');
  }
  const response: ApiResponse = {
    success: true,
  };
  res.json(response);
});

/**
 * GET /api/pillars/strategy
 */
export const handleStrategyOverview = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const overview = await getStrategyOverview(requestUser.id);
  const response: ApiResponse<typeof overview> = {
    success: true,
    data: overview,
  };
  res.json(response);
});
