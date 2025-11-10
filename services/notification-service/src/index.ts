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
import { createNotificationRoutes } from './routes/notification.routes';
import { createTemplateRoutes } from './routes/template.routes';
import { createPreferenceRoutes } from './routes/preference.routes';

const logger = createLogger();
const config = getEnvConfig();
const app = express();

// Initialize container
const container = Container.getInstance();

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
      service: 'notification-service',
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
app.use('/api/v1/notifications', createNotificationRoutes(container.getNotificationController()));
app.use('/api/v1/templates', createTemplateRoutes(container.getEmailTemplateController()));
app.use('/api/v1/preferences', createPreferenceRoutes(container.getNotificationPreferenceController()));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler as any);

// Start server
const PORT = config.PORT || 3007;
const server = app.listen(PORT, async () => {
  logger.info(`Notification Service started on port ${PORT}`, {
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

  // Start scheduled notification processor
  try {
    container.getScheduledNotificationProcessor().start();
    logger.info('Scheduled notification processor started');
  } catch (error) {
    logger.error('Failed to start scheduled notification processor', { error });
  }
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Stop event consumer and disconnect from database
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

export default app;
