import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendUnauthorized, sendForbidden } from '../application/utils/response.util';
import { createLogger } from '../infrastructure/logging/logger';
import { getEnvConfig } from '../config/env';

const logger = createLogger();

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
  };
}

/**
 * Middleware to authenticate requests using JWT
 * Verifies JWT token signature using shared JWT_SECRET
 */
export function authenticate() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendUnauthorized(res, 'Missing or invalid authorization header');
        return;
      }

      const token = authHeader.substring(7);
      const config = getEnvConfig();
      
      // If JWT_SECRET is not configured, fall back to decoding (NOT SECURE - for dev only)
      if (!config.JWT_SECRET) {
        logger.warn('JWT_SECRET not configured, using insecure token decoding (NOT RECOMMENDED FOR PRODUCTION)');
        try {
          const parts = token.split('.');
          if (parts.length !== 3) {
            sendUnauthorized(res, 'Invalid token format');
            return;
          }

          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            sendUnauthorized(res, 'Token expired');
            return;
          }

          req.user = {
            userId: payload.userId,
            email: payload.email,
            roles: payload.roles || [],
          };

          next();
          return;
        } catch (error) {
          logger.warn('Token decode failed', { error });
          sendUnauthorized(res, 'Invalid token');
          return;
        }
      }

      // Verify JWT token signature (PRODUCTION-READY)
      try {
        const payload = jwt.verify(token, config.JWT_SECRET) as any;
        
        // Verify token type (should be 'access' token)
        if (payload.type && payload.type !== 'access') {
          sendUnauthorized(res, 'Invalid token type');
          return;
        }

        req.user = {
          userId: payload.userId,
          email: payload.email,
          roles: payload.roles || [],
        };

        next();
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          sendUnauthorized(res, 'Token expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
          logger.warn('Invalid token', { error: error.message });
          sendUnauthorized(res, 'Invalid token');
        } else {
          logger.error('Token verification failed', { error });
          sendUnauthorized(res, 'Authentication failed');
        }
      }
    } catch (error) {
      sendUnauthorized(res, 'Authentication failed', error instanceof Error ? error.message : undefined);
    }
  };
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (!hasRole) {
      sendForbidden(res, `Insufficient permissions. Required roles: ${roles.join(', ')}`);
      return;
    }

    next();
  };
}

