import { Router } from 'express';
import { NotificationController } from '../application/controllers/NotificationController';
import {
  validateSendNotification,
  validateGetNotifications,
  validateNotificationId,
  handleValidationErrors,
} from '../middleware/validator.middleware';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';

export function createNotificationRoutes(notificationController: NotificationController): Router {
  const router = Router();

  // Apply rate limiting to all routes
  router.use(globalRateLimiter);

  // Send notification
  router.post(
    '/',
    validateSendNotification,
    handleValidationErrors,
    notificationController.sendNotification.bind(notificationController)
  );

  // Get notification by ID
  router.get(
    '/:id',
    validateNotificationId,
    handleValidationErrors,
    notificationController.getNotification.bind(notificationController)
  );

  // Get notifications by user ID
  router.get(
    '/user/:userId',
    validateGetNotifications,
    handleValidationErrors,
    notificationController.getNotificationsByUserId.bind(notificationController)
  );

  // Retry failed notification
  router.post(
    '/:id/retry',
    validateNotificationId,
    handleValidationErrors,
    notificationController.retryNotification.bind(notificationController)
  );

  return router;
}

