import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnvConfig } from '../config/env';
import { createLogger } from '../infrastructure/logging/logger';

const logger = createLogger();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

export function authenticate() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Missing or invalid authorization header',
        });
        return;
      }

      const token = authHeader.substring(7);
      const config = getEnvConfig();
      
      if (!config.JWT_SECRET) {
        logger.warn('JWT_SECRET not configured, using insecure token decoding (NOT RECOMMENDED FOR PRODUCTION)');
        try {
          const parts = token.split('.');
          if (parts.length !== 3) {
            res.status(401).json({
              success: false,
              message: 'Invalid token format',
            });
            return;
          }

          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            res.status(401).json({
              success: false,
              message: 'Token expired',
            });
            return;
          }

          req.user = {
            id: payload.userId,
            userId: payload.userId,
            email: payload.email,
            roles: payload.roles || [],
          };

          next();
          return;
        } catch (error) {
          logger.warn('Token decode failed', { error });
          res.status(401).json({
            success: false,
            message: 'Invalid token',
          });
          return;
        }
      }

      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        
        req.user = {
          id: decoded.userId,
          userId: decoded.userId,
          email: decoded.email,
          roles: decoded.roles || [],
        };

        next();
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          res.status(401).json({
            success: false,
            message: 'Token expired',
          });
          return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
          res.status(401).json({
            success: false,
            message: 'Invalid token',
          });
          return;
        }
        logger.error('Token verification error', { error });
        res.status(401).json({
          success: false,
          message: 'Authentication failed',
        });
      }
    } catch (error) {
      logger.error('Authentication middleware error', { error });
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
      });
    }
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

export function optionalAuth() {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.substring(7);
      const config = getEnvConfig();
      
      if (!config.JWT_SECRET) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            if (!payload.exp || payload.exp * 1000 >= Date.now()) {
              req.user = {
                id: payload.userId,
                userId: payload.userId,
                email: payload.email,
                roles: payload.roles || [],
              };
            }
          }
        } catch (error) {
          // Invalid token - continue without user
        }
        next();
        return;
      }

      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        req.user = {
          id: decoded.userId,
          userId: decoded.userId,
          email: decoded.email,
          roles: decoded.roles || [],
        };
      } catch (error) {
        // Invalid token - continue without user
      }

      next();
    } catch (error) {
      next();
    }
  };
}

