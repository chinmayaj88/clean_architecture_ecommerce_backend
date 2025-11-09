import { Response, NextFunction } from 'express';
import { createLogger } from '../infrastructure/logging/logger';
import { RequestWithId } from './requestId.middleware';

const logger = createLogger();

export function notFoundHandler(req: RequestWithId, res: Response, _next: NextFunction): void {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`, { requestId: req.id });
  res.status(404).json({
    success: false,
    message: 'Not Found',
    path: req.path,
    requestId: req.id,
  });
}

export function errorHandler(
  err: Error,
  req: RequestWithId,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`Unhandled error: ${err.message}`, {
    requestId: req.id,
    path: req.path,
    method: req.method,
    stack: err.stack,
    errorName: err.name,
  });

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    requestId: req.id,
  });
}

