import { PrismaClient } from '@prisma/client';
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

export async function performHealthCheck(prisma: PrismaClient): Promise<HealthStatus> {
  const databaseCheck = await checkDatabase(prisma);

  const checks = {
    database: databaseCheck,
  };

  const isHealthy = databaseCheck.status === 'ok';

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    checks,
  };
}

export async function performReadinessCheck(prisma: PrismaClient): Promise<{ ready: boolean; checks: any }> {
  const databaseCheck = await checkDatabase(prisma);

  const ready = databaseCheck.status === 'ok';

  return {
    ready,
    checks: {
      database: databaseCheck,
    },
  };
}




