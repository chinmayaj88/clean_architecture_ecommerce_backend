import rateLimit from 'express-rate-limit';
import { getEnvConfig } from '../config/env';

const config = getEnvConfig();

export const globalRateLimiter = rateLimit({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS, 10),
  max: parseInt(config.RATE_LIMIT_MAX_REQUESTS, 10),
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

