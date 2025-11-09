import { Router } from 'express';
import { body, query } from 'express-validator';
import { ProductInventoryController } from '../application/controllers/ProductInventoryController';
import { validate } from '../middleware/validator.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { productRateLimiter, productWriteRateLimiter } from '../middleware/rateLimiter.middleware';

export function createProductInventoryRoutes(controller: ProductInventoryController): Router {
  const router = Router({ mergeParams: true });

  // Public routes (read-only)
  router.get(
    '/',
    productRateLimiter,
    validate([
      query('variantId').optional().isString(),
    ]),
    (req, res, next) => {
      controller.get(req, res).catch(next);
    }
  );

  // Protected routes (admin only for create/adjust, authenticated for reserve/release)
  router.post(
    '/',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    validate([
      body('quantity').optional().isInt({ min: 0 }),
      body('reservedQuantity').optional().isInt({ min: 0 }),
      body('location').optional().isString(),
      body('variantId').optional().isString(),
    ]),
    (req, res, next) => {
      controller.create(req, res).catch(next);
    }
  );

  router.post(
    '/reserve',
    productWriteRateLimiter,
    authenticate(),
    validate([
      body('quantity').isInt({ min: 1 }).withMessage('Quantity is required'),
      query('variantId').optional().isString(),
    ]),
    (req, res, next) => {
      controller.reserve(req, res).catch(next);
    }
  );

  router.post(
    '/release',
    productWriteRateLimiter,
    authenticate(),
    validate([
      body('quantity').isInt({ min: 1 }).withMessage('Quantity is required'),
      query('variantId').optional().isString(),
    ]),
    (req, res, next) => {
      controller.release(req, res).catch(next);
    }
  );

  router.post(
    '/adjust',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    validate([
      body('quantity').isInt().withMessage('Quantity is required'),
      body('reason').optional().isString(),
      query('variantId').optional().isString(),
    ]),
    (req, res, next) => {
      controller.adjust(req, res).catch(next);
    }
  );

  return router;
}

