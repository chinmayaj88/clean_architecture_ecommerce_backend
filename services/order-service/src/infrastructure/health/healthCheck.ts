import { PrismaClient } from '@prisma/client';
import { getCache } from '../cache/RedisCache';
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
  };
}

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

async function checkRedis(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    const cache = getCache();
    const result = await cache.healthCheck();
    const responseTime = Date.now() - startTime;
    
    return {
      status: result.status,
      message: result.message,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Redis not available',
      responseTime,
    };
  }
}

export async function performHealthCheck(prisma: PrismaClient): Promise<HealthStatus> {
  const [databaseCheck, redisCheck] = await Promise.all([
    checkDatabase(prisma),
    checkRedis(),
  ]);

  const checks = {
    database: databaseCheck,
    redis: redisCheck,
  };

  // Service is healthy if database is available
  // Redis is optional
  const isHealthy = databaseCheck.status === 'ok';

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'order-service',
    timestamp: new Date().toISOString(),
    checks,
  };
}

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

