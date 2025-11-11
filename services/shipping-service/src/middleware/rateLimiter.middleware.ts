import rateLimit from 'express-rate-limit';
import { getEnvConfig } from '../config/env';

const config = getEnvConfig();

export const globalRateLimiter = rateLimit({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(config.RATE_LIMIT_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

