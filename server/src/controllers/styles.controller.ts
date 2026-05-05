import type { Request, Response } from 'express';
import type { ApiResponse } from '@postcommander/shared';
import { AppError } from '../middleware/error-handler.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';
import {
  createStyle,
  getStyles,
  getStyle,
  deleteStyle,
  generateInStyle,
} from '../services/styles/index.js';

/**
 * GET /api/styles
 */
export const listStyles = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const styles = await getStyles(requestUser.id);
  const response: ApiResponse<typeof styles> = {
    success: true,
    data: styles,
  };
  res.json(response);
});

/**
 * POST /api/styles
 */
export const handleCreateStyle = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const { name, description, samplePosts, provider, model } = req.body;
  const style = await createStyle(
    requestUser.id,
    name,
    description,
    samplePosts,
    provider,
    model,
  );
  const response: ApiResponse<typeof style> = {
    success: true,
    data: style,
  };
  res.status(201).json(response);
});

/**
 * GET /api/styles/:id
 */
export const getStyleById = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const id = req.params.id as string;
  const style = await getStyle(requestUser.id, id);
  if (!style) {
    throw new AppError(404, 'Writing style not found');
  }
  const response: ApiResponse<typeof style> = {
    success: true,
    data: style,
  };
  res.json(response);
});

/**
 * DELETE /api/styles/:id
 */
export const handleDeleteStyle = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const id = req.params.id as string;
  const deleted = await deleteStyle(requestUser.id, id);
  if (!deleted) {
    throw new AppError(404, 'Writing style not found');
  }
  const response: ApiResponse = {
    success: true,
  };
  res.json(response);
});

/**
 * POST /api/styles/:id/generate
 */
export const handleGenerateInStyle = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const { topic, platform, provider, model } = req.body;
  const id = req.params.id as string;
  const result = await generateInStyle(
    requestUser.id,
    id,
    topic,
    platform,
    provider,
    model,
  );
  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
  };
  res.json(response);
});
