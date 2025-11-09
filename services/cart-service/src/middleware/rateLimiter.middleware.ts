import rateLimit from 'express-rate-limit';
import { getEnvConfig } from '../config/env';
import { RequestWithId } from './requestId.middleware';

const config = getEnvConfig();

export const globalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: (req: RequestWithId) => {
    const requestId = (req as any).id || 'unknown';
    return {
      success: false,
      message: 'Too many requests, please try again later.',
      requestId,
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: RequestWithId) => req.ip || 'unknown',
});

