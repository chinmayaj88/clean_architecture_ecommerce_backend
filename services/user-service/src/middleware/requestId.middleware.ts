/**
 * Request ID Middleware
 * Generates and attaches a unique request ID for distributed tracing
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../infrastructure/logging/logger';

const logger = createLogger();

export interface RequestWithId extends Request {
  id?: string;
}

/**
 * Middleware to generate and attach request ID
 */
export function requestIdMiddleware(
  req: RequestWithId,
  _res: Response,
  next: NextFunction
): void {
  req.id = uuidv4();
  logger.debug('Request ID generated', { requestId: req.id, path: req.path });
  next();
}

