import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3004'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // JWT (for token verification)
  JWT_SECRET: z.string().min(32),
  
  // Product Service (for product validation)
  PRODUCT_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  
  // Redis (optional)
  REDIS_URL: z.string().url().optional(),
  
  // Cart Configuration
  CART_EXPIRATION_DAYS: z.string().transform(Number).pipe(z.number().int().positive()).default('30'),
  MAX_CART_ITEMS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  MAX_ITEM_QUANTITY: z.string().transform(Number).pipe(z.number().int().positive()).default('99'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  
  // Request Configuration
  REQUEST_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  SHUTDOWN_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  MAX_REQUEST_SIZE_MB: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('10'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
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

