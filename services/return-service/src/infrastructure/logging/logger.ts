import winston from 'winston';
import { getEnvConfig } from '../../config/env';

const config = getEnvConfig();

export function createLogger() {
  return winston.createLogger({
    level: config.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'return-service' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });
}

