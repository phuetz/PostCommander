import type { Request, Response } from 'express';
import type { ApiResponse } from '@postcommander/shared';
import { AppError } from '../middleware/error-handler.js';
import { catchAsync } from '../utils/catch-async.js';
import { getTemplates, getTemplate, useTemplate } from '../services/templates/index.js';
import { requireRequestUser } from '../utils/request-user.js';

/**
 * GET /api/templates
 */
export const listTemplates = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query =
    (req.validatedQuery as
      | { page: number; pageSize: number; category?: string; platform?: string }
      | undefined) ?? { page: 1, pageSize: 50 };
  const { templates, total } = await getTemplates(query);

  const response: ApiResponse<typeof templates> & { total: number; page: number; pageSize: number } = {
    success: true,
    data: templates,
    total,
    page: query.page,
    pageSize: query.pageSize,
  };

  res.json(response);
});

/**
 * GET /api/templates/:id
 */
export const getTemplateById = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = req.params.id as string;
  const template = await getTemplate(id);
  if (!template) {
    throw new AppError(404, 'Template not found');
  }
  const response: ApiResponse<typeof template> = {
    success: true,
    data: template,
  };
  res.json(response);
});

/**
 * POST /api/templates/:id/generate
 */
export const generateFromTemplate = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const { variables, provider, model } = req.body;
  const id = req.params.id as string;
  const result = await useTemplate(id, variables, provider, model, requestUser.id);
  const response: ApiResponse<typeof result> = {
    success: true,
    data: result,
  };
  res.json(response);
});
