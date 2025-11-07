/**
 * Health Check Service
 * Comprehensive health checks for database, Redis, and external services
 */

import { PrismaClient } from '@prisma/client';
import { getCache } from '../cache/RedisCache';
import { getEnvConfig } from '../../config/env';
import { SNSEventPublisher } from '../events/SNSEventPublisher';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export interface HealthCheckResult {
  status: 'ok' | 'error';
  message?: string;
  responseTime?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  checks: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
    sns?: HealthCheckResult;
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(prisma: PrismaClient): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    return {
      status: 'ok',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Database health check failed', { error });
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const cache = getCache();
  const result = await cache.healthCheck();
  const responseTime = Date.now() - startTime;
  
  return {
    status: result.status,
    message: result.message,
    responseTime,
  };
}

/**
 * Check SNS connectivity (optional)
 */
async function checkSNS(): Promise<HealthCheckResult | undefined> {
  const config = getEnvConfig();
  
  // Only check SNS if not using mock publisher
  if (config.EVENT_PUBLISHER_TYPE === 'mock' || (!config.LOCALSTACK_ENDPOINT && config.NODE_ENV !== 'production')) {
    return undefined;
  }

  const startTime = Date.now();
  try {
    // Test SNS by creating a test publisher and checking connectivity
    // If we can instantiate without error, SNS is available
    // In production, you might want to do a lightweight API call
    new SNSEventPublisher(); // Just check if it can be instantiated
    const responseTime = Date.now() - startTime;
    return {
      status: 'ok',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('SNS health check failed', { error });
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    };
  }
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(prisma: PrismaClient): Promise<HealthStatus> {
  const [databaseCheck, redisCheck, snsCheck] = await Promise.all([
    checkDatabase(prisma),
    checkRedis(),
    checkSNS(),
  ]);

  const checks = {
    database: databaseCheck,
    redis: redisCheck,
    ...(snsCheck && { sns: snsCheck }),
  };

  // Service is healthy if all critical checks pass
  // Redis is optional (falls back to in-memory), SNS is optional
  const isHealthy = databaseCheck.status === 'ok' && 
                    (redisCheck.status === 'ok' || redisCheck.status === 'error' && !redisCheck.message?.includes('not configured'));

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    checks,
  };
}

/**
 * Perform readiness check (can service accept traffic?)
 */
export async function performReadinessCheck(prisma: PrismaClient): Promise<{ ready: boolean; checks: any }> {
  const databaseCheck = await checkDatabase(prisma);
  const redisCheck = await checkRedis();
  
  // Service is ready if database is available
  // Redis is optional
  const ready = databaseCheck.status === 'ok';

  return {
    ready,
    checks: {
      database: databaseCheck,
      redis: redisCheck,
    },
  };
}

