
import { Response, NextFunction } from 'express';
import { createLogger } from '../infrastructure/logging/logger';
import { RequestWithId } from './requestId.middleware';

const logger = createLogger();

// Error handler middleware
export function errorHandler(
  err: Error,
  req: RequestWithId,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Gateway error', {
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path,
    method: req.method,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(isDevelopment && { error: err.message }),
    requestId: req.id,
  });
}

// 404 handler
export function notFoundHandler(req: RequestWithId, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.id,
  });
}

