import { Router } from 'express';
import { ShippingRateController } from '../application/controllers/ShippingRateController';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';
import { optionalAuth } from '../middleware/auth.middleware';

export function createRateRoutes(rateController: ShippingRateController): Router {
  const router = Router();

  router.use(globalRateLimiter);

  // Public route - rate calculation
  router.post(
    '/calculate',
    optionalAuth(),
    (req, res, next) => {
      rateController.calculateRate(req, res).catch(next);
    }
  );

  return router;
}

