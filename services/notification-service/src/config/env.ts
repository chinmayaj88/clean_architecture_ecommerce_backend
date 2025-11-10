import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3007'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32).optional(), // Shared secret with auth-service for token verification

  // Service URLs
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  USER_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  USER_SERVICE_API_KEY: z.string().optional(),
  USER_SERVICE_INTERNAL_TOKEN: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Redis (optional, for rate limiting and caching)
  REDIS_URL: z.string().url().optional(),

  // Email Providers
  EMAIL_PROVIDER: z.enum(['mock', 'sendgrid', 'nodemailer', 'aws-ses']).default('mock'),
  SENDGRID_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().default('noreply@ecommerce.com'),
  SMTP_FROM_NAME: z.string().default('E-Commerce Platform'),
  AWS_SES_REGION: z.string().optional(),

  // SMS Provider
  SMS_PROVIDER: z.enum(['mock', 'twilio']).default('mock'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Push Notifications (Future)
  PUSH_PROVIDER: z.enum(['mock', 'fcm', 'apns']).default('mock'),
  FCM_SERVER_KEY: z.string().optional(),
  APNS_KEY_ID: z.string().optional(),
  APNS_TEAM_ID: z.string().optional(),
  APNS_BUNDLE_ID: z.string().optional(),
  APNS_PRIVATE_KEY: z.string().optional(),

  // AWS/Event Publishing
  AWS_REGION: z.string().default('us-east-1'),
  SNS_TOPIC_ARN: z.string().optional(),
  SQS_QUEUE_URL: z.string().url().optional(),
  EVENT_PUBLISHER_TYPE: z.enum(['mock', 'sns']).optional().default('mock'),
  EVENT_CONSUMER_TYPE: z.enum(['mock', 'sqs']).optional().default('mock'),
  LOCALSTACK_ENDPOINT: z.string().url().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('100'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Timeouts
  REQUEST_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  SHUTDOWN_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('30000'),
  MAX_REQUEST_SIZE_MB: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('10'),

  // CORS
  ALLOWED_ORIGINS: z.string().optional(),

  // Notification Settings
  NOTIFICATION_RETRY_ATTEMPTS: z.string().transform(Number).pipe(z.number().int().min(0)).optional().default('3'),
  NOTIFICATION_RETRY_DELAY_MS: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1000'),
  MAX_NOTIFICATIONS_PER_BATCH: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('100'),
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


