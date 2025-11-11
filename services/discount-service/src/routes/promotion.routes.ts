import { Router } from 'express';
import { PromotionController } from '../application/controllers/PromotionController';
import {
  validateCreatePromotion,
  validatePromotionId,
  validatePromotionRule,
  validatePromotionRuleId,
  handleValidationErrors,
} from '../middleware/validator.middleware';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export function createPromotionRoutes(promotionController: PromotionController): Router {
  const router = Router();

  router.use(globalRateLimiter);

  // Public routes (read-only)
  router.get(
    '/',
    promotionController.getPromotions.bind(promotionController)
  );

  router.get(
    '/:id',
    validatePromotionId,
    handleValidationErrors,
    promotionController.getPromotion.bind(promotionController)
  );

  // Admin routes (require authentication and admin role)
  router.post(
    '/',
    authenticate(),
    requireRole('admin'),
    validateCreatePromotion,
    handleValidationErrors,
    promotionController.createPromotion.bind(promotionController)
  );

  router.put(
    '/:id',
    authenticate(),
    requireRole('admin'),
    validatePromotionId,
    handleValidationErrors,
    promotionController.updatePromotion.bind(promotionController)
  );

  router.delete(
    '/:id',
    authenticate(),
    requireRole('admin'),
    validatePromotionId,
    handleValidationErrors,
    promotionController.deletePromotion.bind(promotionController)
  );

  router.post(
    '/:id/rules',
    authenticate(),
    requireRole('admin'),
    validatePromotionId,
    validatePromotionRule,
    handleValidationErrors,
    promotionController.addPromotionRule.bind(promotionController)
  );

  router.put(
    '/:id/rules/:ruleId',
    authenticate(),
    requireRole('admin'),
    validatePromotionRuleId,
    handleValidationErrors,
    promotionController.updatePromotionRule.bind(promotionController)
  );

  router.delete(
    '/:id/rules/:ruleId',
    authenticate(),
    requireRole('admin'),
    validatePromotionRuleId,
    handleValidationErrors,
    promotionController.deletePromotionRule.bind(promotionController)
  );

  return router;
}

