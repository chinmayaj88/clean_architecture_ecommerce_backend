import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import timeout from 'connect-timeout';
import { getEnvConfig } from './config/env';
import { Container } from './di/container';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { performHealthCheck, performReadinessCheck } from './infrastructure/health/healthCheck';
import { createLogger } from './infrastructure/logging/logger';
import { createRateRoutes } from './routes/rate.routes';
import { createShipmentRoutes } from './routes/shipment.routes';
import { createZoneRoutes } from './routes/zone.routes';
import { createMethodRoutes } from './routes/method.routes';

const logger = createLogger();
const config = getEnvConfig();
const app = express();

// Initialize container
const container = Container.getInstance();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.ALLOWED_ORIGINS?.split(',') || (config.NODE_ENV === 'production' ? [] : '*'),
  credentials: true,
}));
app.use(cookieParser());
const maxRequestSizeMB = parseInt(config.MAX_REQUEST_SIZE_MB || '10', 10);
app.use(express.json({ limit: `${maxRequestSizeMB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${maxRequestSizeMB}mb` }));
app.use(timeout('30000ms'));
app.use(requestIdMiddleware as express.RequestHandler);

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
      service: 'shipping-service',
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

// API routes
app.use('/api/v1/rates', createRateRoutes(container.getShippingRateController()));
app.use('/api/v1/shipments', createShipmentRoutes(container.getShipmentController()));
app.use('/api/v1/zones', createZoneRoutes(container.getShippingZoneController()));
app.use('/api/v1/methods', createMethodRoutes(container.getShippingMethodController()));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler as any);

// Start server
const PORT = parseInt(config.PORT, 10) || 3009;
const server = app.listen(PORT, async () => {
  logger.info(`Shipping Service started on port ${PORT}`, {
    env: config.NODE_ENV,
    port: PORT,
  });

  // Start event consumer
  try {
    await container.getEventConsumer().start();
    logger.info('Event consumer started');
  } catch (error) {
    logger.error('Failed to start event consumer', { error });
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await container.getEventConsumer().stop();
      await container.disconnect();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error });
      process.exit(1);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

