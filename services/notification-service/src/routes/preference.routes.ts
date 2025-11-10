import { Router } from 'express';
import { NotificationPreferenceController } from '../application/controllers/NotificationPreferenceController';
import {
  validateGetPreferences,
  validateCreatePreference,
  validateUpdatePreference,
  validatePreferenceParams,
  handleValidationErrors,
} from '../middleware/validator.middleware';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';

export function createPreferenceRoutes(preferenceController: NotificationPreferenceController): Router {
  const router = Router();

  // Apply rate limiting to all routes
  router.use(globalRateLimiter);

  // Get user preferences
  router.get(
    '/',
    validateGetPreferences,
    handleValidationErrors,
    preferenceController.getPreferences.bind(preferenceController)
  );

  // Get user preference by type
  router.get(
    '/:userId/:notificationType',
    validatePreferenceParams,
    handleValidationErrors,
    preferenceController.getPreference.bind(preferenceController)
  );

  // Create preference
  router.post(
    '/',
    validateCreatePreference,
    handleValidationErrors,
    preferenceController.createPreference.bind(preferenceController)
  );

  // Update preference
  router.put(
    '/',
    validateUpdatePreference,
    handleValidationErrors,
    preferenceController.updatePreferences.bind(preferenceController)
  );

  return router;
}

