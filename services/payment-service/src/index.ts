import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import timeout from 'connect-timeout';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { getEnvConfig } from './config/env';
import { Container } from './di/container';
import { createPaymentRoutes } from './routes/payment.routes';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { globalRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { performHealthCheck, performReadinessCheck } from './infrastructure/health/healthCheck';
import { createLogger } from './infrastructure/logging/logger';
import { enforceHttps, setSecurityHeaders } from './middleware/httpsEnforcement.middleware';

const logger = createLogger();
const config = getEnvConfig();
const app = express();

// Initialize container
const container = Container.getInstance();

// Security middleware (HTTPS enforcement in production)
if (config.NODE_ENV === 'production') {
  app.use(enforceHttps);
}
app.use(setSecurityHeaders);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: `${config.MAX_REQUEST_SIZE_MB || 10}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.MAX_REQUEST_SIZE_MB || 10}mb` }));
app.use(timeout(`${config.REQUEST_TIMEOUT_MS || 30000}ms`));
app.use(requestIdMiddleware);
app.use(globalRateLimiter);

// Health checks
app.get('/health', async (_req, res) => {
  try {
    const healthStatus = await performHealthCheck(container.getPrisma());
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/ready', async (_req, res) => {
  try {
    const readiness = await performReadinessCheck(container.getPrisma());
    const statusCode = readiness.ready ? 200 : 503;
    res.status(statusCode).json(readiness);
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API Documentation (Swagger UI)
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Payment Service API Documentation',
  }));
  logger.info('Swagger UI available at /api-docs');
} catch (error) {
  logger.warn('Failed to load OpenAPI documentation', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}

// API routes
app.use('/api/v1', createPaymentRoutes(container.getPaymentController()));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  try {
    await container.disconnect();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
const PORT = config.PORT || 3006;
app.listen(PORT, () => {
  logger.info(`Payment Service started on port ${PORT}`, {
    env: config.NODE_ENV,
    port: PORT,
  });
});

export default app;

