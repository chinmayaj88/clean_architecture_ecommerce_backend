import { Request, Response, NextFunction } from 'express';
import { getEnvConfig } from '../config/env';
import { createLogger } from '../infrastructure/logging/logger';
import rateLimit from 'express-rate-limit';
import { RequestWithId } from './requestId.middleware';

const logger = createLogger();
const config = getEnvConfig();

/**
 * Webhook IP whitelist configuration
 * In production, configure allowed IPs for each payment provider
 */
const WEBHOOK_IP_WHITELIST: Record<string, string[]> = {
  stripe: process.env.STRIPE_WEBHOOK_IPS?.split(',') || [],
  paypal: process.env.PAYPAL_WEBHOOK_IPS?.split(',') || [],
};

/**
 * Middleware to verify webhook IP addresses
 * In production, payment providers have specific IP ranges that should be whitelisted
 */
export function verifyWebhookIp(req: Request, res: Response, next: NextFunction): void {
  // Skip IP verification in development or if whitelist is not configured
  if (config.NODE_ENV !== 'production' || !process.env.ENABLE_WEBHOOK_IP_WHITELIST) {
    return next();
  }

  const provider = (req.body.provider || '').toLowerCase();
  const allowedIps = WEBHOOK_IP_WHITELIST[provider] || [];

  // If no IPs configured for provider, allow all (not recommended for production)
  if (allowedIps.length === 0) {
    logger.warn('No IP whitelist configured for webhook provider', { provider });
    return next();
  }

  // Get client IP (considering proxies)
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.ip ||
    req.socket.remoteAddress;

  // Check if IP is whitelisted
  const isAllowed = allowedIps.some((allowedIp) => {
    // Support CIDR notation
    if (allowedIp.includes('/')) {
      // Simple CIDR check (for production, use a proper CIDR library)
      return clientIp?.startsWith(allowedIp.split('/')[0]);
    }
    return clientIp === allowedIp;
  });

  if (!isAllowed) {
    logger.warn('Webhook request from unauthorized IP', {
      provider,
      clientIp,
      allowedIps,
      path: req.path,
    });
    res.status(403).json({
      success: false,
      message: 'Forbidden: IP address not whitelisted',
      requestId: (req as RequestWithId).id,
    });
    return;
  }

  next();
}

/**
 * Rate limiter specifically for webhook endpoints
 * More lenient than global rate limiter since webhooks come from trusted sources
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: (req: RequestWithId) => {
    const requestId = (req as any).id || 'unknown';
    return {
      success: false,
      message: 'Too many webhook requests, please try again later.',
      requestId,
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: RequestWithId) => {
    // Use IP or provider event ID for rate limiting
    const body = (req as any).body || {};
    const providerEventId = body.providerEventId || body.id;
    return providerEventId || req.ip || 'unknown';
  },
  skip: (_req: Request) => {
    // Skip rate limiting in development
    return config.NODE_ENV !== 'production';
  },
});

