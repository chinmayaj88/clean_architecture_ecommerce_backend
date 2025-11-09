
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import timeout from 'connect-timeout';
import { getEnvConfig } from './config/env';
import { createProxyRoutes, serviceHealthChecker } from './routes/proxy.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { requestIdMiddleware, RequestWithId } from './middleware/requestId.middleware';
import { globalRateLimiter, authRateLimiter } from './middleware/rateLimiter.middleware';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { requestValidator } from './middleware/requestValidator.middleware';
import { createLogger } from './infrastructure/logging/logger';
import { getMetricsCollector } from './infrastructure/metrics/MetricsCollector';
import { getResponseCache } from './infrastructure/cache/ResponseCache';
import { circuitBreakerManager } from './routes/proxy.routes';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const logger = createLogger();
const config = getEnvConfig();

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions: cors.CorsOptions = {
  credentials: true,
  optionsSuccessStatus: 200,
};

if (config.NODE_ENV === 'production') {
  const allowedOrigins = config.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) || [];
  
  if (allowedOrigins.length === 0) {
    logger.warn('No ALLOWED_ORIGINS configured in production. CORS will be restrictive.');
  }
  
  corsOptions.origin = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  };
} else {
  // Allow all origins in development
  corsOptions.origin = '*';
}

app.use(cors(corsOptions));
app.use(requestIdMiddleware);

// Request timeout
const requestTimeoutMs = config.REQUEST_TIMEOUT_MS;
app.use(timeout(`${requestTimeoutMs}ms`));

app.use((req: RequestWithId, res, next) => {
  if (!req.timedout) {
    next();
  } else {
    res.status(408).json({
      success: false,
      message: 'Request timeout',
      requestId: req.id,
    });
  }
});

// Body parsing
const maxRequestSizeMB = config.MAX_REQUEST_SIZE_MB;
app.use(express.json({ limit: `${maxRequestSizeMB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${maxRequestSizeMB}mb` }));
app.use(cookieParser());

// Request logging
app.use((req: RequestWithId, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Request validation
app.use(requestValidator);

// Metrics middleware (must be before routes)
app.use(metricsMiddleware);

// Health check with service status
app.get('/health', async (_req, res) => {
  const serviceHealth = serviceHealthChecker.getAllHealth();
  const allHealthy = serviceHealth.every((h) => h.healthy);

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    status: allHealthy ? 'healthy' : 'degraded',
    service: 'gateway-service',
    timestamp: new Date().toISOString(),
    services: serviceHealth,
  });
});

// Readiness check
app.get('/ready', async (_req, res) => {
  // Check if at least one service is available
  const serviceHealth = serviceHealthChecker.getAllHealth();
  const hasHealthyService = serviceHealth.some((h) => h.healthy);

  res.status(hasHealthyService ? 200 : 503).json({
    ready: hasHealthyService,
    service: 'gateway-service',
    timestamp: new Date().toISOString(),
    services: serviceHealth,
  });
});

// Metrics endpoint
app.get('/metrics', (_req, res) => {
  const metricsCollector = getMetricsCollector();
  const metrics = metricsCollector.getMetricsSummary();
  const circuitBreakers = circuitBreakerManager.getBreakerMetrics();
  const cacheStats = getResponseCache().getStats();

  res.json({
    gateway: {
      service: 'gateway-service',
      timestamp: new Date().toISOString(),
    },
    requests: metrics,
    circuitBreakers,
    cache: cacheStats,
    services: serviceHealthChecker.getAllHealth(),
  });
});

// Service health endpoint
app.get('/health/services', (_req, res) => {
  res.json({
    services: serviceHealthChecker.getAllHealth(),
    timestamp: new Date().toISOString(),
  });
});

// API Documentation
try {
  const openApiSpecPath = path.join(__dirname, '../openapi.yaml');
  const openApiSpec = YAML.load(openApiSpecPath);

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Gateway Service API Documentation',
      customfavIcon: '/favicon.ico',
    })
  );

  app.get('/api-docs/openapi.yaml', (_req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.sendFile(path.resolve(openApiSpecPath));
  });

  logger.info('OpenAPI documentation available at /api-docs');
} catch (error) {
  logger.warn('Failed to load OpenAPI documentation', { error });
}

// Apply global rate limiting
app.use(globalRateLimiter);

// Apply stricter rate limiting to auth endpoints
app.use('/api/v1/auth/login', authRateLimiter);
app.use('/api/v1/auth/register', authRateLimiter);
app.use('/api/v1/auth/forgot-password', authRateLimiter);
app.use('/api/v1/auth/reset-password', authRateLimiter);

// Proxy routes
const proxyRoutes = createProxyRoutes();
app.use(proxyRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

let server: any = null;

if (process.env.NODE_ENV !== 'test') {
  const PORT = config.PORT;

  server = app.listen(PORT, () => {
        logger.info(`Gateway service started on port ${PORT}`, {
          environment: config.NODE_ENV,
          port: PORT,
          authServiceUrl: config.AUTH_SERVICE_URL,
          userServiceUrl: config.USER_SERVICE_URL,
          productServiceUrl: config.PRODUCT_SERVICE_URL,
          cartServiceUrl: config.CART_SERVICE_URL,
        });

    // Start periodic health checks
    serviceHealthChecker.startPeriodicChecks();
  });

  server.timeout = requestTimeoutMs;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

const shutdownTimeout = config.SHUTDOWN_TIMEOUT_MS;

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully`);

  if (!server) {
    process.exit(0);
    return;
  }

  const shutdownTimer = setTimeout(() => {
    logger.error('Shutdown timeout reached, forcing exit');
    process.exit(1);
  }, shutdownTimeout);

  try {
    server.close(async () => {
      logger.info('HTTP server closed');

      // Stop health checks
      serviceHealthChecker.stopPeriodicChecks();

      clearTimeout(shutdownTimer);
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });

    // Backup timeout
    setTimeout(() => {
      logger.error('Server close timeout, forcing exit');
      clearTimeout(shutdownTimer);
      process.exit(1);
    }, shutdownTimeout - 1000);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    clearTimeout(shutdownTimer);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
