import { Router } from 'express';
import { ShippingZoneController } from '../application/controllers/ShippingZoneController';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export function createZoneRoutes(zoneController: ShippingZoneController): Router {
  const router = Router();

  router.use(globalRateLimiter);

  // Public routes (read-only)
  router.get(
    '/',
    (req, res, next) => {
      zoneController.getZones(req, res).catch(next);
    }
  );

  router.get(
    '/:id',
    (req, res, next) => {
      zoneController.getZone(req, res).catch(next);
    }
  );

  // Admin routes
  router.post(
    '/',
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      zoneController.createZone(req, res).catch(next);
    }
  );

  router.put(
    '/:id',
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      zoneController.updateZone(req, res).catch(next);
    }
  );

  router.delete(
    '/:id',
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      zoneController.deleteZone(req, res).catch(next);
    }
  );

  return router;
}

