
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3000'),
  
  // Service URLs
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  USER_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  PRODUCT_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  CART_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  ORDER_SERVICE_URL: z.string().url().default('http://localhost:3005'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://localhost:3006'),
  
  // JWT secret for token validation
  JWT_SECRET: z.string().min(32),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  RATE_LIMIT_AUTH_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('5'),
  
  // Redis for distributed rate limiting (optional)
  REDIS_URL: z.string().url().optional(),
  
  // CORS
  ALLOWED_ORIGINS: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Timeouts
  REQUEST_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('30000'),
  SHUTDOWN_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('30000'),
  PROXY_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('25000'),
  
  // Request size
  MAX_REQUEST_SIZE_MB: z.string().transform(Number).pipe(z.number().int().positive()).default('10'),
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

