import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3006'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(32).optional(), // Shared secret with auth-service for token verification
  
  // Encryption (PCI Compliance)
  ENCRYPTION_KEY: z.string().optional(), // 32-byte key for AES-256 encryption (hex encoded, 64 characters)
  
  // Service URLs
  ORDER_SERVICE_URL: z.string().url().default('http://localhost:3005'),
  USER_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  
  // Payment Providers
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_WEBHOOK_IPS: z.string().optional(), // Comma-separated list of Stripe webhook IPs
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_WEBHOOK_IPS: z.string().optional(), // Comma-separated list of PayPal webhook IPs
  PAYMENT_PROVIDER: z.enum(['mock', 'stripe', 'paypal']).default('mock'),
  ENABLE_WEBHOOK_IP_WHITELIST: z.string().transform((val) => val === 'true').optional().default('false'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('100'),
  
  // AWS/Event Publishing
  AWS_REGION: z.string().default('us-east-1'),
  SNS_TOPIC_ARN: z.string().optional(),
  SQS_QUEUE_URL: z.string().url().optional(),
  EVENT_PUBLISHER_TYPE: z.enum(['mock', 'sns']).optional(),
  EVENT_CONSUMER_TYPE: z.enum(['mock', 'sqs']).optional(),
  LOCALSTACK_ENDPOINT: z.string().url().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Timeouts
  REQUEST_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  SHUTDOWN_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  MAX_REQUEST_SIZE_MB: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('10'),
  
  // CORS
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

