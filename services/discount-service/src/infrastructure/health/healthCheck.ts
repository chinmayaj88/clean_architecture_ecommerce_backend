import { PrismaClient } from '@prisma/client';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  checks?: {
    database?: {
      status: 'up' | 'down';
      responseTime?: number;
    };
  };
}

export interface ReadinessStatus {
  ready: boolean;
  checks?: {
    database?: {
      ready: boolean;
    };
  };
}

export async function performHealthCheck(prisma: PrismaClient): Promise<HealthStatus> {
  const startTime = Date.now();
  let dbStatus: 'up' | 'down' = 'down';
  let responseTime: number | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'up';
    responseTime = Date.now() - startTime;
  } catch (error) {
    // Database is down
  }

  return {
    status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
    service: 'discount-service',
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: dbStatus,
        responseTime,
      },
    },
  };
}

export async function performReadinessCheck(prisma: PrismaClient): Promise<ReadinessStatus> {
  let dbReady = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
  } catch (error) {
    // Database is not ready
  }

  return {
    ready: dbReady,
    checks: {
      database: {
        ready: dbReady,
      },
    },
  };
}

