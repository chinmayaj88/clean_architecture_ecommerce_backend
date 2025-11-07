import { Request, Response, NextFunction } from 'express';
import { getEnvConfig } from '../config/env';
import { sendError, sendNotFound, sendInternalError } from '../application/utils/response.util';
import { createLogger } from '../infrastructure/logging/logger';

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
  req: Request,
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
    requestId: (req as any).id,
  };

  if (err instanceof AppError) {
    logger.warn('Operational error', errorContext);
    const errorDetails = config.NODE_ENV === 'development' ? err.stack : undefined;
    sendError(res, err.statusCode, err.message, errorDetails);
    return;
  }

  logger.error('Unhandled error', errorContext);
  const errorDetails = config.NODE_ENV === 'development' ? err.stack : undefined;
  sendInternalError(res, 'Internal server error', errorDetails);
}

export function notFoundHandler(_req: Request, res: Response): void {
  sendNotFound(res, 'Route not found');
}

