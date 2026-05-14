import type { Request, Response } from 'express';
import type { ApiResponse } from '@postcommander/shared';
import {
  startLogin,
  getChatGptAuth,
  logoutChatGpt,
  cancelLogin,
} from '../services/auth/codex/index.js';
import { catchAsync } from '../utils/catch-async.js';
import { requireRequestUser } from '../utils/request-user.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';

/**
 * POST /api/auth/chatgpt-pro/start
 * Starts the OAuth listener and returns the URL the client must open.
 * Errors with a CLI fallback hint if the listener cannot bind.
 */
export const handleStart = catchAsync(async (req: Request, res: Response) => {
  const user = requireRequestUser(req);

  try {
    const { authUrl, port } = await startLogin(user.id);
    const response: ApiResponse<{ authUrl: string; port: number }> = {
      success: true,
      data: { authUrl, port },
    };
    res.json(response);
  } catch (err) {
    logger.error({ err }, 'startLogin failed');
    const message = err instanceof Error ? err.message : 'login init failed';
    throw new AppError(
      503,
      `${message}. Si le port 1455 est occupé, lance manuellement : node scripts/pc-login-chatgpt.mjs`,
    );
  }
});

/**
 * GET /api/auth/chatgpt-pro/status
 * Returns whether the user has a valid (or refreshable) ChatGPT Pro auth on file.
 */
export const handleStatus = catchAsync(async (req: Request, res: Response) => {
  const user = requireRequestUser(req);
  const auth = await getChatGptAuth(user.id);

  const response: ApiResponse<{
    connected: boolean;
    email?: string;
    planType?: string;
    accountId?: string;
  }> = {
    success: true,
    data: {
      connected: auth !== null,
      email: auth?.email,
      planType: auth?.plan_type,
      accountId: auth?.account_id,
    },
  };
  res.json(response);
});

/**
 * POST /api/auth/chatgpt-pro/logout
 * Wipes the stored auth and cancels any in-flight login for the user.
 */
export const handleLogout = catchAsync(async (req: Request, res: Response) => {
  const user = requireRequestUser(req);
  await cancelLogin(user.id);
  await logoutChatGpt(user.id);
  const response: ApiResponse<{ disconnected: true }> = {
    success: true,
    data: { disconnected: true },
  };
  res.json(response);
});
