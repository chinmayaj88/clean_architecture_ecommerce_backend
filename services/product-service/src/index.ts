import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import timeout from 'connect-timeout';
import { getEnvConfig } from './config/env';
import { Container } from './di/container';
import { createProductRoutes } from './routes/product.routes';
import { createCategoryRoutes } from './routes/category.routes';
import { createProductVariantRoutes } from './routes/product-variant.routes';
import { createProductVariantDirectRoutes } from './routes/product-variant-direct.routes';
import { createProductImageRoutes } from './routes/product-image.routes';
import { createProductTagRoutes } from './routes/product-tag.routes';
import { createProductInventoryRoutes } from './routes/product-inventory.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { createLogger } from './infrastructure/logging/logger';
import { performHealthCheck, performReadinessCheck } from './infrastructure/health/healthCheck';
import { getCache } from './infrastructure/cache/RedisCache';

const logger = createLogger();
const config = getEnvConfig();

const app = express();

// Helmet v8 requires explicit configuration
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
  corsOptions.origin = '*';
}

app.use(cors(corsOptions));
app.use(requestIdMiddleware);

const requestTimeoutMs = config.REQUEST_TIMEOUT_MS;
app.use(timeout(`${requestTimeoutMs}ms`));

app.use((req, res, next) => {
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

const maxRequestSizeMB = config.MAX_REQUEST_SIZE_MB;
app.use(express.json({ limit: `${maxRequestSizeMB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${maxRequestSizeMB}mb` }));
app.use(cookieParser());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

app.get('/health', async (_req, res) => {
  try {
    const container = Container.getInstance();
    const prisma = container.getPrisma();
    const healthStatus = await performHealthCheck(prisma);

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: healthStatus.status === 'healthy',
      message: healthStatus.status === 'healthy' ? 'Service is healthy' : 'Service is unhealthy',
      data: healthStatus,
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/ready', async (_req, res) => {
  try {
    const container = Container.getInstance();
    const prisma = container.getPrisma();
    const readiness = await performReadinessCheck(prisma);

    const statusCode = readiness.ready ? 200 : 503;
    res.status(statusCode).json({
      ready: readiness.ready,
      checks: readiness.checks,
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

try {
  const openApiSpecPath = path.join(__dirname, '../openapi.yaml');
  const openApiSpec = YAML.load(openApiSpecPath);

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Product Service API Documentation',
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

const container = Container.getInstance();
const categoryRoutes = createCategoryRoutes(container.getCategoryController());
const productRoutes = createProductRoutes(container.getProductController());
const productVariantRoutes = createProductVariantRoutes(container.getProductVariantController());
const productVariantDirectRoutes = createProductVariantDirectRoutes(container.getProductVariantController());
const productImageRoutes = createProductImageRoutes(container.getProductImageController());
const productTagRoutes = createProductTagRoutes(container.getProductTagController());
const productInventoryRoutes = createProductInventoryRoutes(container.getProductInventoryController());

// Register routes in order of specificity
// Direct variant routes (by ID) - for service-to-service communication (must come before nested routes)
app.use('/api/v1/products/variants', productVariantDirectRoutes);
// Nested routes (by productId)
app.use('/api/v1/products/:productId/variants', productVariantRoutes);
app.use('/api/v1/products/:productId/images', productImageRoutes);
app.use('/api/v1/products/:productId/tags', productTagRoutes);
app.use('/api/v1/products/:productId/inventory', productInventoryRoutes);
// Main product routes (must come last to avoid conflicts)
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

let server: any = null;

if (process.env.NODE_ENV !== 'test') {
  const PORT = config.PORT;

  server = app.listen(PORT, () => {
    logger.info(`Product service started on port ${PORT}`, {
      environment: config.NODE_ENV,
      port: PORT,
    });
  });

  server.timeout = requestTimeoutMs;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

const shutdownTimeout = config.SHUTDOWN_TIMEOUT_MS;

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

      try {
        await container.dispose();
        logger.info('Container disposed');

        const cache = getCache();
        await cache.disconnect();
        logger.info('Redis cache disconnected');

        clearTimeout(shutdownTimer);
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown cleanup', { error });
        clearTimeout(shutdownTimer);
        process.exit(1);
      }
    });

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
