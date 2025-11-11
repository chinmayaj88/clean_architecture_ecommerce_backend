import { Router } from 'express';
import { ShippingMethodController } from '../application/controllers/ShippingMethodController';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export function createMethodRoutes(methodController: ShippingMethodController): Router {
  const router = Router();

  router.use(globalRateLimiter);

  // Public routes (read-only)
  router.get(
    '/',
    (req, res, next) => {
      methodController.getMethods(req, res).catch(next);
    }
  );

  router.get(
    '/:id',
    (req, res, next) => {
      methodController.getMethod(req, res).catch(next);
    }
  );

  // Admin routes
  router.post(
    '/',
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      methodController.createMethod(req, res).catch(next);
    }
  );

  router.put(
    '/:id',
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      methodController.updateMethod(req, res).catch(next);
    }
  );

  router.delete(
    '/:id',
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      methodController.deleteMethod(req, res).catch(next);
    }
  );

  return router;
}

