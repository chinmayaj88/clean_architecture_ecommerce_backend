import { Router } from 'express';
import { body } from 'express-validator';
import { ProductVariantController } from '../application/controllers/ProductVariantController';
import { validate } from '../middleware/validator.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { productRateLimiter, productWriteRateLimiter } from '../middleware/rateLimiter.middleware';

export function createProductVariantRoutes(controller: ProductVariantController): Router {
  const router = Router({ mergeParams: true }); // Merge params from parent router

  // Public routes (read-only)
  router.get('/:id', productRateLimiter, (req, res, next) => {
    controller.getById(req, res).catch(next);
  });

  router.get('/', productRateLimiter, (req, res, next) => {
    controller.getByProductId(req, res).catch(next);
  });

  // Protected routes (admin only)
  router.post(
    '/',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    validate([
      body('sku').notEmpty().withMessage('SKU is required'),
      body('name').optional().isString(),
      body('price').optional().isFloat({ min: 0 }),
      body('compareAtPrice').optional().isFloat({ min: 0 }),
      body('stockQuantity').optional().isInt({ min: 0 }),
      body('stockStatus').optional().isIn(['in_stock', 'out_of_stock', 'backorder']),
      body('attributes').optional().isObject(),
      body('imageUrl').optional().isString(),
    ]),
    (req, res, next) => {
      controller.create(req, res).catch(next);
    }
  );

  router.put(
    '/:id',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    validate([
      body('price').optional().isFloat({ min: 0 }),
      body('compareAtPrice').optional().isFloat({ min: 0 }),
      body('stockQuantity').optional().isInt({ min: 0 }),
      body('stockStatus').optional().isIn(['in_stock', 'out_of_stock', 'backorder']),
    ]),
    (req, res, next) => {
      controller.update(req, res).catch(next);
    }
  );

  router.delete(
    '/:id',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      controller.delete(req, res).catch(next);
    }
  );

  return router;
}

