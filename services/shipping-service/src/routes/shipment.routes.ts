import { Router } from 'express';
import { ShipmentController } from '../application/controllers/ShipmentController';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

export function createShipmentRoutes(shipmentController: ShipmentController): Router {
  const router = Router();

  router.use(globalRateLimiter);

  // Public route - track by tracking number
  router.get(
    '/track/:trackingNumber',
    optionalAuth(),
    (req, res, next) => {
      shipmentController.trackByNumber(req, res).catch(next);
    }
  );

  // Authenticated routes
  router.post(
    '/',
    authenticate(),
    (req, res, next) => {
      shipmentController.createShipment(req, res).catch(next);
    }
  );

  router.get(
    '/order/:orderId',
    authenticate(),
    (req, res, next) => {
      shipmentController.getShipmentsByOrder(req, res).catch(next);
    }
  );

  router.get(
    '/:id',
    authenticate(),
    (req, res, next) => {
      shipmentController.getShipment(req, res).catch(next);
    }
  );

  router.get(
    '/:id/tracking',
    authenticate(),
    (req, res, next) => {
      shipmentController.getTracking(req, res).catch(next);
    }
  );

  router.put(
    '/:id/status',
    authenticate(),
    (req, res, next) => {
      shipmentController.updateStatus(req, res).catch(next);
    }
  );

  return router;
}

