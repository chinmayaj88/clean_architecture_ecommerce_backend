import { Router } from 'express';
import { CouponController } from '../application/controllers/CouponController';
import {
  validateCreateCoupon,
  validateUpdateCoupon,
  validateCouponId,
  validateCouponCode,
  handleValidationErrors,
} from '../middleware/validator.middleware';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export function createCouponRoutes(couponController: CouponController): Router {
  const router = Router();

  router.use(globalRateLimiter);

  // Public routes (read-only)
  router.get(
    '/',
    couponController.getCoupons.bind(couponController)
  );

  router.get(
    '/:id',
    validateCouponId,
    handleValidationErrors,
    couponController.getCoupon.bind(couponController)
  );

  router.get(
    '/code/:code',
    validateCouponCode,
    handleValidationErrors,
    couponController.getCouponByCode.bind(couponController)
  );

  // Admin routes (require authentication and admin role)
  router.post(
    '/',
    authenticate(),
    requireRole('admin'),
    validateCreateCoupon,
    handleValidationErrors,
    couponController.createCoupon.bind(couponController)
  );

  router.put(
    '/:id',
    authenticate(),
    requireRole('admin'),
    validateCouponId,
    validateUpdateCoupon,
    handleValidationErrors,
    couponController.updateCoupon.bind(couponController)
  );

  router.delete(
    '/:id',
    authenticate(),
    requireRole('admin'),
    validateCouponId,
    handleValidationErrors,
    couponController.deleteCoupon.bind(couponController)
  );

  router.post(
    '/:id/activate',
    authenticate(),
    requireRole('admin'),
    validateCouponId,
    handleValidationErrors,
    couponController.activateCoupon.bind(couponController)
  );

  router.post(
    '/:id/deactivate',
    authenticate(),
    requireRole('admin'),
    validateCouponId,
    handleValidationErrors,
    couponController.deactivateCoupon.bind(couponController)
  );

  return router;
}

