import { Request, Response, NextFunction } from 'express';
import { getEnvConfig } from '../config/env';
import { createLogger } from '../infrastructure/logging/logger';
import { RequestWithId } from './requestId.middleware';

const logger = createLogger();

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request & RequestWithId,
  res: Response,
  _next: NextFunction
): void {
  const config = getEnvConfig();

  const errorContext = {
    error: err.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: (req as RequestWithId).id,
  };

  if (err instanceof AppError) {
    logger.warn('Operational error', errorContext);
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      requestId: (req as RequestWithId).id,
    });
    return;
  }

  logger.error('Unhandled error', errorContext);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    requestId: (req as RequestWithId).id,
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}

