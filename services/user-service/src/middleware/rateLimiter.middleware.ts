/**
 * Rate Limiter Middleware
 * Distributed rate limiting using Redis
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getCache } from '../infrastructure/cache/RedisCache';

export function createRateLimiter(options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}) {
  const cache = getCache();
  const redisClient = cache.getClient();

  const rateLimiterOptions: any = {
    windowMs: options?.windowMs ?? 15 * 60 * 1000, // 15 minutes
    max: options?.max ?? 100, // 100 requests per window
    message: options?.message ?? 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  };

  // Use Redis store if Redis is available
  if (redisClient && cache.isAvailable()) {
    rateLimiterOptions.store = new RedisStore({
      sendCommand: (...args: string[]) => {
        return (redisClient as any).call(...args);
      },
      prefix: 'rl:user:',
    });
  }

  return rateLimit(rateLimiterOptions);
}

