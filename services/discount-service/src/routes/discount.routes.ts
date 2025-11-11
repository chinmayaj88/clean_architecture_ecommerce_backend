import { Router } from 'express';
import { DiscountController } from '../application/controllers/DiscountController';
import {
  validateValidateCoupon,
  validateCalculateDiscount,
  validateApplyCoupon,
  validateEvaluatePromotions,
  handleValidationErrors,
} from '../middleware/validator.middleware';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';
import { optionalAuth, authenticate } from '../middleware/auth.middleware';

export function createDiscountRoutes(discountController: DiscountController): Router {
  const router = Router();

  router.use(globalRateLimiter);

  // Public routes (validation and calculation can be done without auth)
  router.post(
    '/validate',
    optionalAuth(),
    validateValidateCoupon,
    handleValidationErrors,
    discountController.validateCoupon.bind(discountController)
  );

  router.post(
    '/calculate',
    optionalAuth(),
    validateCalculateDiscount,
    handleValidationErrors,
    discountController.calculateDiscount.bind(discountController)
  );

  router.post(
    '/evaluate-promotions',
    optionalAuth(),
    validateEvaluatePromotions,
    handleValidationErrors,
    discountController.evaluatePromotions.bind(discountController)
  );

  // Apply coupon requires authentication (to track user usage)
  router.post(
    '/apply',
    authenticate(),
    validateApplyCoupon,
    handleValidationErrors,
    discountController.applyCoupon.bind(discountController)
  );

  return router;
}

