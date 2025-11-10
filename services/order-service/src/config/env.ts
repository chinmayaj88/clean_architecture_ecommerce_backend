import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3005'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // JWT (for token verification)
  JWT_SECRET: z.string().min(32),
  
  // Service URLs
  CART_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  PRODUCT_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  USER_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  
  // Redis (optional)
  REDIS_URL: z.string().url().optional(),
  
  // Order Configuration
  ORDER_NUMBER_PREFIX: z.string().default('ORD'),
  MAX_ORDER_ITEMS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  
  // Request Configuration
  REQUEST_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  SHUTDOWN_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  MAX_REQUEST_SIZE_MB: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('10'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // AWS/Event Publishing
  AWS_REGION: z.string().default('us-east-1'),
  SNS_TOPIC_ARN: z.string().optional(),
  EVENT_PUBLISHER_TYPE: z.enum(['mock', 'sns']).optional(),
  LOCALSTACK_ENDPOINT: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (config) {
    return config;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.message}`);
  }

  config = result.data;
  return config;
}

