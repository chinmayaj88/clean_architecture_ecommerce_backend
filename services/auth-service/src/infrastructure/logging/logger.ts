/**
 * Logger Implementation
 * Structured JSON logging using Winston
 */

import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { getEnvConfig } from '../../config/env';
import { getEnvironmentConfig } from '../../config/environment';

export function createLogger() {
  const config = getEnvConfig();
  const envConfig = getEnvironmentConfig();

  const logger = winston.createLogger({
    level: envConfig.getLogLevel(),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: 'auth-service',
      environment: config.NODE_ENV,
    },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });

  if (envConfig.isProduction() || envConfig.isStaging()) {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    logger.add(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
      })
    );
    logger.add(
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
      })
    );
  }

  return logger;
}

