import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@postcommander/shared';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  if (statusCode >= 500) {
    logger.error({ err }, err.message);
  } else {
    logger.warn({ err: err.message }, 'Client error');
  }

  const message =
    err instanceof AppError ? err.message : 'An unexpected error occurred. Please try again later.';

  const response: ApiResponse = {
    success: false,
    error: message,
  };

  res.status(statusCode).json(response);
}
