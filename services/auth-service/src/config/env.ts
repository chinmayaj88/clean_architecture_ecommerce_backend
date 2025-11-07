
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3001'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.string().transform((val) => val === 'true').default('false'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  MAX_LOGIN_ATTEMPTS: z.string().transform(Number).pipe(z.number().int().positive()).default('5'),
  LOCKOUT_DURATION_MINUTES: z.string().transform(Number).pipe(z.number().int().positive()).default('30'),
  REDIS_URL: z.string().url().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  SNS_TOPIC_ARN: z.string().optional(),
  SQS_QUEUE_URL: z.string().optional(),
  AWS_ACCOUNT_ID: z.string().optional(),
  EVENT_PUBLISHER_TYPE: z.enum(['mock', 'sns']).optional(),
  LOCALSTACK_ENDPOINT: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  REQUEST_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  SHUTDOWN_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  MAX_REQUEST_SIZE_MB: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('10'),
  ALLOWED_ORIGINS: z.string().optional(),
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

