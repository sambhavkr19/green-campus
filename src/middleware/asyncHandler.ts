import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async Handler Wrapper
 * Eliminates repetitive try-catch blocks in async express controller functions
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
