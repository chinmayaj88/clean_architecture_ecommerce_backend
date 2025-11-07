/**
 * Request ID Middleware
 * Adds unique request ID to each request for distributed tracing
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Middleware to add request ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate or use existing request ID
  req.id = req.headers['x-request-id'] as string || uuidv4();
  
  // Set response header
  res.setHeader('X-Request-ID', req.id);
  
  next();
}

