
import { Request, Response, NextFunction } from 'express';
import { getMetricsCollector } from '../infrastructure/metrics/MetricsCollector';
import { RequestWithId } from './requestId.middleware';

const metricsCollector = getMetricsCollector();

// Middleware to collect request metrics
export function metricsMiddleware(req: RequestWithId, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Extract service name from path
  const serviceName = getServiceNameFromPath(req.path);

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;

    metricsCollector.recordRequest({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      service: serviceName,
      timestamp: Date.now(),
    });

    // Call original end
    originalEnd.call(res, chunk, encoding);
  };

  next();
}

function getServiceNameFromPath(path: string): string {
  if (path.startsWith('/api/v1/auth') || path.startsWith('/api/v1/security')) {
    return 'auth-service';
  } else if (path.startsWith('/api/v1/users')) {
    return 'user-service';
  } else if (path.startsWith('/api/v1/products')) {
    return 'product-service';
  }
  return 'gateway';
}

