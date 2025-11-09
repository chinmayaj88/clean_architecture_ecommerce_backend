/**
 * Rate Limiting Middleware
 * Uses Redis for distributed rate limiting across multiple instances
 */

import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getEnvConfig } from '../config/env';
import { getCache } from '../infrastructure/cache/RedisCache';

/**
 * Create rate limiter middleware
 * Uses Redis store if available, falls back to in-memory
 */
export function createRateLimiter(options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}) {
  const cache = getCache();
  const redisClient = cache.getClient();

  const rateLimiterOptions: any = {
    windowMs: options?.windowMs ?? 15 * 60 * 1000, // 15 minutes default
    max: options?.max ?? 100, // 100 requests per window default
    message: options?.message ?? 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  };

  // Use Redis store if Redis is available (rate-limit-redis v4 API)
  if (redisClient && cache.isAvailable()) {
    try {
      rateLimiterOptions.store = new (RedisStore as any)({
        client: redisClient,
        prefix: 'rl:user:',
      });
    } catch (error) {
      // Fallback to in-memory if Redis store fails
      console.warn('Failed to initialize Redis store for rate limiting, using in-memory store');
    }
  }

  return rateLimit(rateLimiterOptions);
}
