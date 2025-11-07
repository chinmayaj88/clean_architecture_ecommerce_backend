/**
 * Authentication Middleware with RBAC
 * Validates JWT tokens and checks roles by calling auth-service
 */

import { Request, Response, NextFunction } from 'express';
import { IAuthServiceClient } from '../ports/interfaces/IAuthServiceClient';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
  };
}

/**
 * Middleware to authenticate requests using JWT
 * Extracts token and verifies with auth-service
 */
export function authenticate(authClient: IAuthServiceClient) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ 
          success: false,
          message: 'Missing or invalid authorization header',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const userInfo = await authClient.verifyToken(token);

      if (!userInfo) {
        res.status(401).json({ 
          success: false,
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Attach user to request
      req.user = userInfo;
      next();
    } catch (error) {
      res.status(401).json({ 
        success: false,
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (!hasRole) {
      res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions. Required roles: ' + roles.join(', '),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user owns the resource or has admin role
 */
export function requireOwnershipOrRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if user has required role (admin, etc.)
    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (hasRole) {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.params.userId || req.body.userId;
    if (resourceUserId && resourceUserId === req.user.userId) {
      next();
      return;
    }

    res.status(403).json({ 
      success: false,
      message: 'You can only access your own resources',
      timestamp: new Date().toISOString(),
    });
  };
}

