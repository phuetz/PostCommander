import type { Request, Response } from 'express';
import type { ApiResponse, AssistFieldResponse, LLMProviderId } from '@postcommander/shared';
import { suggestFieldValue } from '../services/llm/assist.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';

/**
 * POST /api/assist/field
 * Body: { field: AssistFieldKey, context?: Record<string, unknown>, locale?: string, provider?: string, model?: string }
 */
export const handleAssistField = catchAsync(async (req: Request, res: Response) => {
  const user = requireRequestUser(req);
  const body = req.body as {
    field: import('@postcommander/shared').AssistFieldKey;
    context?: Record<string, unknown>;
    locale?: string;
    provider?: string;
    model?: string;
  };

  const result = await suggestFieldValue({
    field: body.field,
    context: body.context ?? {},
    locale: body.locale ?? 'fr',
    userId: user.id,
    provider: body.provider as LLMProviderId | undefined,
    model: body.model,
  });

  const response: ApiResponse<AssistFieldResponse> = {
    success: true,
    data: result,
  };

  res.json(response);
});
