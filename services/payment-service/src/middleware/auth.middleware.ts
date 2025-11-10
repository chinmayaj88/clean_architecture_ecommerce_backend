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
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header',
        requestId: req.id,
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!config.JWT_SECRET) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Authentication configuration error',
        requestId: req.id,
      });
      return;
    }

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

      next();
    } catch (error) {
      logger.warn('Invalid token', { requestId: req.id, error });
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        requestId: req.id,
      });
    }
  } catch (error) {
    logger.error('Authentication error', { requestId: req.id, error });
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      requestId: req.id,
    });
  }
}

