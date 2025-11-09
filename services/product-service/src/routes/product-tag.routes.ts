import { Router } from 'express';
import { body } from 'express-validator';
import { ProductTagController } from '../application/controllers/ProductTagController';
import { validate } from '../middleware/validator.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { productRateLimiter, productWriteRateLimiter } from '../middleware/rateLimiter.middleware';

export function createProductTagRoutes(controller: ProductTagController): Router {
  const router = Router({ mergeParams: true });

  // Public routes (read-only)
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
      body('tag').notEmpty().isString().withMessage('Tag is required'),
    ]),
    (req, res, next) => {
      controller.create(req, res).catch(next);
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

  router.delete(
    '/tag/:tag',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      controller.deleteByTag(req, res).catch(next);
    }
  );

  return router;
}

