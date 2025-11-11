import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3009'),
  LOG_LEVEL: z.string().default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32).optional(), // Shared secret with auth-service for token verification

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  // CORS
  ALLOWED_ORIGINS: z.string().optional(),

  // Request size
  MAX_REQUEST_SIZE_MB: z.string().default('10'),

  // Service URLs
  ORDER_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  PRODUCT_SERVICE_URL: z.string().url().default('http://localhost:3003'),

  // Service API Keys (optional)
  ORDER_SERVICE_API_KEY: z.string().optional(),
  PRODUCT_SERVICE_API_KEY: z.string().optional(),

  // Internal Service Tokens (optional)
  ORDER_SERVICE_INTERNAL_TOKEN: z.string().optional(),
  PRODUCT_SERVICE_INTERNAL_TOKEN: z.string().optional(),

  // AWS/Event Publishing
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SNS_TOPIC_ARN: z.string().optional(),
  SQS_QUEUE_URL: z.string().url().optional().or(z.literal('')),
  EVENT_PUBLISHER_TYPE: z.enum(['mock', 'sns']).optional().default('mock'),
  EVENT_CONSUMER_TYPE: z.enum(['mock', 'sqs']).optional().default('mock'),
  LOCALSTACK_ENDPOINT: z.string().url().optional(),
});

let envConfig: z.infer<typeof envSchema> | null = null;

export function getEnvConfig(): z.infer<typeof envSchema> {
  if (envConfig) {
    return envConfig;
  }

  try {
    envConfig = envSchema.parse(process.env);
    return envConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Environment validation failed: ${missingVars}`);
    }
    throw error;
  }
}

