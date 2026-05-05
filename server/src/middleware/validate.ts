import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema } from 'zod';
import type { ApiResponse } from '@postcommander/shared';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (and potentially transformed) value.
 * On failure, responds with a 400 JSON error.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const formatted = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');

      const response: ApiResponse = {
        success: false,
        error: `Validation error: ${formatted}`,
      };

      res.status(400).json(response);
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Validate query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const formatted = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');

      const response: ApiResponse = {
        success: false,
        error: `Query validation error: ${formatted}`,
      };

      res.status(400).json(response);
      return;
    }

    // Attach parsed query to req for downstream use
    req.validatedQuery = result.data;
    next();
  };
}
