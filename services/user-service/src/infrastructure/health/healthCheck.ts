/**
 * Health Check Implementation
 * Provides health and readiness checks for Kubernetes/Docker
 */

import { PrismaClient } from '@prisma/client';
import { getCache } from '../cache/RedisCache';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      responseTime: number;
    };
    redis?: {
      status: 'ok' | 'error';
      responseTime: number;
    };
  };
}

export interface ReadinessStatus {
  ready: boolean;
  checks: {
    database: {
      status: 'ok' | 'error';
      responseTime: number;
    };
    redis?: {
      status: 'ok' | 'error';
      responseTime: number;
    };
  };
}

/**
 * Perform health check
 */
export async function performHealthCheck(prisma: PrismaClient): Promise<HealthStatus> {
  const startTime = Date.now();
  let dbStatus: 'ok' | 'error' = 'error';
  let dbResponseTime = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'ok';
    dbResponseTime = Date.now() - startTime;
  } catch (error) {
    dbResponseTime = Date.now() - startTime;
  }

  // Check Redis
  const cache = getCache();
  const redisCheck = await cache.healthCheck();
  const redisStatus: 'ok' | 'error' = redisCheck.status === 'ok' ? 'ok' : 'error';

  const checks: HealthStatus['checks'] = {
    database: {
      status: dbStatus,
      responseTime: dbResponseTime,
    },
  };

  if (cache.isAvailable()) {
    checks.redis = {
      status: redisStatus,
      responseTime: 0, // Redis health check doesn't measure response time
    };
  }

  return {
    status: dbStatus === 'ok' ? 'healthy' : 'unhealthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    checks,
  };
}

/**
 * Perform readiness check
 */
export async function performReadinessCheck(prisma: PrismaClient): Promise<ReadinessStatus> {
  const startTime = Date.now();
  let dbStatus: 'ok' | 'error' = 'error';
  let dbResponseTime = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'ok';
    dbResponseTime = Date.now() - startTime;
  } catch (error) {
    dbResponseTime = Date.now() - startTime;
  }

  const cache = getCache();
  const redisCheck = await cache.healthCheck();
  const redisStatus: 'ok' | 'error' = redisCheck.status === 'ok' ? 'ok' : 'error';

  const checks: ReadinessStatus['checks'] = {
    database: {
      status: dbStatus,
      responseTime: dbResponseTime,
    },
  };

  if (cache.isAvailable()) {
    checks.redis = {
      status: redisStatus,
      responseTime: 0,
    };
  }

  return {
    ready: dbStatus === 'ok',
    checks,
  };
}

