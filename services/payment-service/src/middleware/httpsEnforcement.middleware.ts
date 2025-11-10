import { Request, Response, NextFunction } from 'express';
import { getEnvConfig } from '../config/env';
import { createLogger } from '../infrastructure/logging/logger';

const logger = createLogger();
const config = getEnvConfig();

/**
 * Middleware to enforce HTTPS in production
 * Redirects HTTP requests to HTTPS and sets HSTS headers
 */
export function enforceHttps(req: Request, res: Response, next: NextFunction): void {
  // Skip HTTPS enforcement in development or if not in production
  if (config.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is already secure (HTTPS)
  const isSecure =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    req.headers['x-forwarded-ssl'] === 'on';

  if (!isSecure) {
    // Redirect to HTTPS
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    logger.warn('Redirecting HTTP request to HTTPS', {
      url: req.url,
      host: req.headers.host,
      redirectTo: httpsUrl,
    });
    return res.redirect(301, httpsUrl);
  }

  // Set HSTS (HTTP Strict Transport Security) header
  // max-age: 31536000 = 1 year
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  next();
}

/**
 * Middleware to set security headers for HTTPS
 */
export function setSecurityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Set HSTS header (even if not enforcing HTTPS redirect)
  if (config.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

