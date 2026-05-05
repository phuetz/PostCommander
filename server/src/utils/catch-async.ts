import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async express handler and catches any errors to pass them to next().
 * This eliminates the need for repeated try/catch blocks in controllers.
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
