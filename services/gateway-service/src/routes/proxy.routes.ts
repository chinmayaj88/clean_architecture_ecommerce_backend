
import { Router, Response, NextFunction, Request } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { getEnvConfig } from '../config/env';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { createLogger } from '../infrastructure/logging/logger';
import { RequestWithId } from '../middleware/requestId.middleware';
import { CircuitBreakerManager } from '../infrastructure/circuit-breaker/CircuitBreakerManager';
import { ServiceHealthChecker } from '../infrastructure/health/ServiceHealthChecker';
import { getResponseCache } from '../infrastructure/cache/ResponseCache';

const logger = createLogger();
const config = getEnvConfig();

// Initialize circuit breaker manager
const circuitBreakerManager = new CircuitBreakerManager({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000, // 30 seconds
  monitorWindow: 60000, // 1 minute
});

// Initialize service health checker
const serviceHealthChecker = new ServiceHealthChecker(30000); // Check every 30 seconds

// Initialize response cache
const responseCache = getResponseCache();

// Helper to create proxy middleware with circuit breaker and retry logic
function createServiceProxy(
  serviceName: string,
  target: string,
  pathRewrite: Record<string, string>,
  options?: { cacheable?: boolean; cacheTTL?: number }
) {
  // Register service for health checking
  serviceHealthChecker.registerService(serviceName, target);

  // Get circuit breaker for this service
  const circuitBreaker = circuitBreakerManager.getBreaker(serviceName);

  // Create proxy middleware with circuit breaker integration
  const proxyMiddleware = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: config.PROXY_TIMEOUT_MS,
    onProxyReq: (proxyReq: any, req: RequestWithId) => {
      // Forward request ID
      if (req.id) {
        proxyReq.setHeader('X-Request-Id', req.id);
      }

      // Forward user info if authenticated
      if ((req as AuthenticatedRequest).user) {
        const user = (req as AuthenticatedRequest).user!;
        proxyReq.setHeader('X-User-Id', user.userId);
        proxyReq.setHeader('X-User-Email', user.email);
        proxyReq.setHeader('X-User-Roles', user.roles.join(','));
      }

      logger.debug(`Proxying ${req.method} ${req.path} to ${target}`, {
        requestId: req.id,
        target,
        service: serviceName,
      });
    },
    onProxyRes: (proxyRes: any, req: RequestWithId) => {
      const statusCode = proxyRes.statusCode;
      
      // Track success/failure for circuit breaker
      if (statusCode >= 200 && statusCode < 400) {
        // Success
        circuitBreaker.recordSuccess();
      } else if (statusCode >= 500) {
        // Server error - track failure
        circuitBreaker.recordFailure();
      }

      logger.debug(`Proxy response ${statusCode} for ${req.path}`, {
        requestId: req.id,
        statusCode,
        service: serviceName,
      });
    },
    onError: (err: Error, req: RequestWithId, res: Response) => {
      // Track failure
      circuitBreaker.recordFailure();

      logger.error('Proxy error', {
        error: err.message,
        requestId: req.id,
        path: req.path,
        target,
        service: serviceName,
      });

      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable',
          requestId: req.id,
          service: serviceName,
        });
      }
    },
    logLevel: 'silent',
  } as Options);

  // Wrap with circuit breaker and caching middleware
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check circuit breaker state before processing
    const breakerState = circuitBreaker.getState();
    const isServiceHealthy = serviceHealthChecker.isServiceHealthy(serviceName);

    // Reject if circuit breaker is open and service is unhealthy
    if (breakerState === 'OPEN' && !isServiceHealthy) {
      logger.warn(`Circuit breaker OPEN for ${serviceName} - rejecting request`, {
        requestId: (req as RequestWithId).id,
        service: serviceName,
      });
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable',
        requestId: (req as RequestWithId).id,
        service: serviceName,
      });
      return;
    }

    // Check cache for GET requests (if cacheable)
    if (options?.cacheable && req.method === 'GET') {
      const cacheKey = responseCache.generateKey(
        req.method,
        req.path,
        req.url.split('?')[1],
        (req as AuthenticatedRequest).user?.userId
      );
      const cached = responseCache.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for ${req.path}`, {
          requestId: (req as RequestWithId).id,
          service: serviceName,
        });
        res.json(cached);
        return;
      }
    }

    // Intercept response for caching (before proxy processes it)
    if (options?.cacheable && req.method === 'GET') {
      const originalJson = res.json.bind(res);
      
      res.json = function (body: any) {
        // Cache successful responses
        if (res.statusCode === 200 && body) {
          try {
            const cacheKey = responseCache.generateKey(
              req.method,
              req.path,
              req.url.split('?')[1],
              (req as AuthenticatedRequest).user?.userId
            );
            responseCache.set(cacheKey, body, options.cacheTTL);
          } catch (error) {
            logger.warn('Failed to cache response', { error });
          }
        }
        return originalJson(body);
      };
    }

    // Execute proxy middleware (circuit breaker tracks in callbacks)
    proxyMiddleware(req, res, next);
  };
}

// Routes that don't require authentication
const publicAuthRoutes = [
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/resend-verification',
];

// Check if route requires authentication
function requiresAuth(path: string, method: string = 'GET'): boolean {
  // Auth service public routes
  if (path.startsWith('/api/v1/auth/')) {
    return !publicAuthRoutes.some(route => path.startsWith(route));
  }

  // Product service - most routes are public
  if (path.startsWith('/api/v1/products')) {
    // Only admin routes need auth
    return path.includes('/admin') || path.includes('/moderate');
  }

  // User service - all routes require auth
  if (path.startsWith('/api/v1/users')) {
    return true;
  }

  // Security routes require auth
  if (path.startsWith('/api/v1/security')) {
    return true;
  }

  // Cart service - merge endpoint requires auth
  if (path.startsWith('/api/v1/carts')) {
    return path.includes('/merge');
  }

  // Order service - all routes require auth
  if (path.startsWith('/api/v1/orders')) {
    return true;
  }

  // Payment service - all routes require auth except webhooks
  if (path.startsWith('/api/v1/payments') || path.startsWith('/api/v1/payment-methods')) {
    return true;
  }

  // Payment webhooks - no auth (verified by signature)
  if (path.startsWith('/api/v1/webhooks')) {
    return false;
  }

  // Discount service - management routes require auth
  if (path.startsWith('/api/v1/coupons') || path.startsWith('/api/v1/promotions')) {
    // POST, PUT, DELETE require auth (GET is public)
    // Note: The service handles its own auth, but we apply conditional auth at gateway
    return method !== 'GET';
  }

  // Discount validation/calculation - optional auth
  if (path.startsWith('/api/v1/discounts')) {
    // Apply endpoint requires auth, validate/calculate are optional
    return path.includes('/apply');
  }

  // Notification service - all routes require auth
  if (path.startsWith('/api/v1/notifications') || path.startsWith('/api/v1/templates') || path.startsWith('/api/v1/preferences')) {
    return true;
  }

  // Shipping service - management routes require auth
  if (path.startsWith('/api/v1/zones') || path.startsWith('/api/v1/methods')) {
    return method !== 'GET';
  }

  // Shipping service - shipment management requires auth
  if (path.startsWith('/api/v1/shipments')) {
    // Track by number is public, others require auth
    return !path.includes('/track/');
  }

  // Shipping rate calculation - optional auth
  if (path.startsWith('/api/v1/rates')) {
    return false; // Public
  }

  // Return service - all routes require auth
  if (path.startsWith('/api/v1/returns')) {
    return true;
  }

  return false;
}

// Middleware to conditionally apply auth
function conditionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (requiresAuth(req.path, req.method)) {
    authenticate(req, res, next);
  } else {
    optionalAuth(req, res, next);
  }
}

export function createProxyRoutes(): Router {
  const router = Router();

  // Auth service proxy
  router.use(
    '/api/v1/auth',
    conditionalAuth,
    createServiceProxy('auth-service', config.AUTH_SERVICE_URL, {
      '^/api/v1/auth': '/api/v1/auth',
    })
  );

  // Security routes (require auth)
  router.use(
    '/api/v1/security',
    authenticate,
    createServiceProxy('auth-service', config.AUTH_SERVICE_URL, {
      '^/api/v1/security': '/api/v1/security',
    })
  );

  // User service proxy (requires auth, cacheable)
  router.use(
    '/api/v1/users',
    authenticate,
    createServiceProxy('user-service', config.USER_SERVICE_URL, {
      '^/api/v1/users': '/api/v1/users',
    }, {
      cacheable: true,
      cacheTTL: 30000, // 30 seconds cache for user data
    })
  );

  // Product service proxy (mostly public, cacheable)
  router.use(
    '/api/v1/products',
    conditionalAuth,
    createServiceProxy('product-service', config.PRODUCT_SERVICE_URL, {
      '^/api/v1/products': '/api/v1/products',
    }, {
      cacheable: true,
      cacheTTL: 60000, // 1 minute cache for products
    })
  );

  // Categories proxy (public, cacheable)
  router.use(
    '/api/v1/categories',
    conditionalAuth,
    createServiceProxy('product-service', config.PRODUCT_SERVICE_URL, {
      '^/api/v1/categories': '/api/v1/categories',
    }, {
      cacheable: true,
      cacheTTL: 300000, // 5 minutes cache for categories (they don't change often)
    })
  );

  // Cart service proxy (requires auth for user carts, supports guest carts)
  router.use(
    '/api/v1/carts',
    conditionalAuth,
    createServiceProxy('cart-service', config.CART_SERVICE_URL, {
      '^/api/v1/carts': '/api/v1/carts',
    }, {
      cacheable: false, // Cart data is user-specific and frequently updated
    })
  );

  // Order service proxy (requires auth)
  router.use(
    '/api/v1/orders',
    authenticate,
    createServiceProxy('order-service', config.ORDER_SERVICE_URL, {
      '^/api/v1/orders': '/api/v1/orders',
    }, {
      cacheable: false, // Order data is user-specific and frequently updated
    })
  );

  // Payment service proxy (requires auth for payments, no auth for webhooks)
  router.use(
    '/api/v1/payments',
    conditionalAuth,
    createServiceProxy('payment-service', config.PAYMENT_SERVICE_URL, {
      '^/api/v1/payments': '/api/v1/payments',
    }, {
      cacheable: false, // Payment data is sensitive and frequently updated
    })
  );

  router.use(
    '/api/v1/payment-methods',
    authenticate,
    createServiceProxy('payment-service', config.PAYMENT_SERVICE_URL, {
      '^/api/v1/payment-methods': '/api/v1/payment-methods',
    }, {
      cacheable: false, // Payment method data is sensitive
    })
  );

  router.use(
    '/api/v1/webhooks',
    createServiceProxy('payment-service', config.PAYMENT_SERVICE_URL, {
      '^/api/v1/webhooks': '/api/v1/webhooks',
    }, {
      cacheable: false, // Webhooks should not be cached
    })
  );

  // Discount service proxy
  // Note: The discount service handles its own auth, but we apply auth at gateway level too
  router.use(
    '/api/v1/coupons',
    conditionalAuth, // GET is public, POST/PUT/DELETE require auth (handled by service)
    createServiceProxy('discount-service', config.DISCOUNT_SERVICE_URL, {
      '^/api/v1/coupons': '/api/v1/coupons',
    }, {
      cacheable: false, // Coupon data changes frequently
    })
  );

  router.use(
    '/api/v1/promotions',
    conditionalAuth, // GET is public, POST/PUT/DELETE require auth (handled by service)
    createServiceProxy('discount-service', config.DISCOUNT_SERVICE_URL, {
      '^/api/v1/promotions': '/api/v1/promotions',
    }, {
      cacheable: false, // Promotion data changes frequently
    })
  );

  router.use(
    '/api/v1/discounts',
    conditionalAuth, // Validation can be public, application requires auth
    createServiceProxy('discount-service', config.DISCOUNT_SERVICE_URL, {
      '^/api/v1/discounts': '/api/v1/discounts',
    }, {
      cacheable: false, // Discount calculations are user-specific
    })
  );

  // Notification service proxy (requires auth)
  router.use(
    '/api/v1/notifications',
    authenticate,
    createServiceProxy('notification-service', config.NOTIFICATION_SERVICE_URL, {
      '^/api/v1/notifications': '/api/v1/notifications',
    }, {
      cacheable: false, // Notification data is user-specific
    })
  );

  router.use(
    '/api/v1/templates',
    authenticate, // Template management requires auth (admin check handled by service)
    createServiceProxy('notification-service', config.NOTIFICATION_SERVICE_URL, {
      '^/api/v1/templates': '/api/v1/templates',
    }, {
      cacheable: false, // Template data changes infrequently but shouldn't be cached
    })
  );

  router.use(
    '/api/v1/preferences',
    authenticate,
    createServiceProxy('notification-service', config.NOTIFICATION_SERVICE_URL, {
      '^/api/v1/preferences': '/api/v1/preferences',
    }, {
      cacheable: false, // Preference data is user-specific
    })
  );

  // Shipping service proxy
  router.use(
    '/api/v1/rates',
    conditionalAuth, // Rate calculation can be public
    createServiceProxy('shipping-service', config.SHIPPING_SERVICE_URL, {
      '^/api/v1/rates': '/api/v1/rates',
    }, {
      cacheable: false, // Rate calculations are dynamic
    })
  );

  router.use(
    '/api/v1/shipments',
    authenticate, // Shipment management requires auth
    createServiceProxy('shipping-service', config.SHIPPING_SERVICE_URL, {
      '^/api/v1/shipments': '/api/v1/shipments',
    }, {
      cacheable: false, // Shipment data is user-specific
    })
  );

  router.use(
    '/api/v1/zones',
    conditionalAuth, // GET is public, management requires auth
    createServiceProxy('shipping-service', config.SHIPPING_SERVICE_URL, {
      '^/api/v1/zones': '/api/v1/zones',
    }, {
      cacheable: true,
      cacheTTL: 300000, // 5 minutes cache for zones (they don't change often)
    })
  );

  router.use(
    '/api/v1/methods',
    conditionalAuth, // GET is public, management requires auth
    createServiceProxy('shipping-service', config.SHIPPING_SERVICE_URL, {
      '^/api/v1/methods': '/api/v1/methods',
    }, {
      cacheable: true,
      cacheTTL: 300000, // 5 minutes cache for methods
    })
  );

  // Return service proxy (requires auth)
  router.use(
    '/api/v1/returns',
    authenticate, // All return routes require authentication
    createServiceProxy('return-service', config.RETURN_SERVICE_URL, {
      '^/api/v1/returns': '/api/v1/returns',
    }, {
      cacheable: false, // Return data is user-specific
    })
  );

  return router;
}

// Export circuit breaker manager and health checker for monitoring
export { circuitBreakerManager, serviceHealthChecker };

