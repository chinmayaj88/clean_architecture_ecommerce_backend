import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnvConfig } from '../config/env';
import { createLogger } from '../infrastructure/logging/logger';
import { RequestWithId } from './requestId.middleware';

const config = getEnvConfig();
const logger = createLogger();

export interface AuthenticatedRequest extends RequestWithId {
  user?: {
    userId: string;
    email: string;
    roles: string[];
  };
  sessionId?: string;
}

// Optional auth middleware - doesn't fail if no token (for guest carts)
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const payload = jwt.verify(token, config.JWT_SECRET) as {
          userId: string;
          email: string;
          roles: string[];
        };

        req.user = {
          userId: payload.userId,
          email: payload.email,
          roles: payload.roles || [],
        };
      } catch (error) {
        // Invalid token, continue without user (guest cart)
      }
    }

    // Get or generate session ID for guest carts
    if (!req.user) {
      req.sessionId = req.headers['x-session-id'] as string || req.cookies?.sessionId || undefined;
    }

    next();
  } catch (error) {
    next();
  }
}

// Required auth middleware
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: Missing or invalid authorization header', { requestId: req.id });
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as { userId: string; email: string; roles: string[] };
    req.user = {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles || [],
    };
    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid or expired token', { requestId: req.id, error: error instanceof Error ? error.message : 'unknown' });
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

