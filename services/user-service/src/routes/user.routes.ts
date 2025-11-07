/**
 * User Service Routes
 * Defines all API endpoints with RBAC
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { UserController } from '../application/controllers/UserController';
import { authenticate, requireOwnershipOrRole, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware';
import { Container } from '../di/container';
import { createRateLimiter } from '../middleware/rateLimiter.middleware';
import { validate } from '../middleware/validator.middleware';

// Rate limiters
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests
});

const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 requests for write operations
});

export function createUserRoutes(controller: UserController): Router {
  const router = Router();
  const authClient = Container.getInstance().getAuthServiceClient();

  // Apply general rate limiting to all routes
  router.use(generalRateLimiter);

  // Public routes (no auth required, but limited)
  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', service: 'user-service' });
  });

  // Protected routes - require authentication
  router.use(authenticate(authClient));

  // User Profile Routes
  router.get(
    '/users/:userId',
    [
      param('userId').isString().notEmpty(),
      validate,
    ],
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.getProfile(req, res).catch(next);
    }
  );

  router.get(
    '/users',
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Get own profile if no userId provided
      controller.getProfile(req, res).catch(next);
    }
  );

  router.put(
    '/users/:userId',
    [
      param('userId').isString().notEmpty(),
      body('firstName').optional().isString().isLength({ min: 1, max: 100 }),
      body('lastName').optional().isString().isLength({ min: 1, max: 100 }),
      body('phone').optional().matches(/^\+?[1-9]\d{1,14}$/),
      body('avatarUrl').optional().isURL(),
      body('dateOfBirth').optional().isISO8601(),
      body('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say']),
      body('preferredCurrency').optional().isLength({ min: 3, max: 3 }),
      body('preferredLanguage').optional().isLength({ min: 2, max: 2 }),
      body('newsletterSubscribed').optional().isBoolean(),
      body('marketingOptIn').optional().isBoolean(),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.updateProfile(req, res).catch(next);
    }
  );

  // Address Routes
  router.post(
    '/users/:userId/addresses',
    [
      param('userId').isString().notEmpty(),
      body('type').isIn(['shipping', 'billing', 'both']),
      body('firstName').isString().isLength({ min: 1, max: 100 }),
      body('lastName').isString().isLength({ min: 1, max: 100 }),
      body('addressLine1').isString().isLength({ min: 1, max: 200 }),
      body('city').isString().isLength({ min: 1, max: 100 }),
      body('postalCode').isString().isLength({ min: 1, max: 20 }),
      body('country').isLength({ min: 2, max: 2 }),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.createAddress(req, res).catch(next);
    }
  );

  router.get(
    '/users/:userId/addresses',
    [
      param('userId').isString().notEmpty(),
      query('type').optional().isIn(['shipping', 'billing', 'both']),
      validate,
    ],
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.getAddresses(req, res).catch(next);
    }
  );

  router.put(
    '/users/:userId/addresses/:addressId',
    [
      param('userId').isString().notEmpty(),
      param('addressId').isString().notEmpty(),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.updateAddress(req, res).catch(next);
    }
  );

  router.delete(
    '/users/:userId/addresses/:addressId',
    [
      param('userId').isString().notEmpty(),
      param('addressId').isString().notEmpty(),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.deleteAddress(req, res).catch(next);
    }
  );

  // Payment Method Routes
  router.post(
    '/users/:userId/payment-methods',
    [
      param('userId').isString().notEmpty(),
      body('type').isIn(['credit_card', 'debit_card', 'paypal', 'bank_account']),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.createPaymentMethod(req, res).catch(next);
    }
  );

  router.get(
    '/users/:userId/payment-methods',
    [
      param('userId').isString().notEmpty(),
      validate,
    ],
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.getPaymentMethods(req, res).catch(next);
    }
  );

  router.put(
    '/users/:userId/payment-methods/:paymentMethodId',
    [
      param('userId').isString().notEmpty(),
      param('paymentMethodId').isString().notEmpty(),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.updatePaymentMethod(req, res).catch(next);
    }
  );

  router.delete(
    '/users/:userId/payment-methods/:paymentMethodId',
    [
      param('userId').isString().notEmpty(),
      param('paymentMethodId').isString().notEmpty(),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.deletePaymentMethod(req, res).catch(next);
    }
  );

  // Wishlist Routes
  router.post(
    '/users/:userId/wishlist',
    [
      param('userId').isString().notEmpty(),
      body('productId').isString().notEmpty(),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.addToWishlist(req, res).catch(next);
    }
  );

  router.get(
    '/users/:userId/wishlist',
    [
      param('userId').isString().notEmpty(),
      validate,
    ],
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.getWishlist(req, res).catch(next);
    }
  );

  router.delete(
    '/users/:userId/wishlist/:itemId',
    [
      param('userId').isString().notEmpty(),
      param('itemId').isString().notEmpty(),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.removeFromWishlist(req, res).catch(next);
    }
  );

  // Recently Viewed Products Routes
  router.post(
    '/users/:userId/recently-viewed',
    [
      param('userId').isString().notEmpty(),
      body('productId').isString().notEmpty(),
      body('productName').optional().isString(),
      body('productImageUrl').optional().isURL(),
      body('productPrice').optional().isFloat({ min: 0 }),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.trackProductView(req, res).catch(next);
    }
  );

  router.get(
    '/users/:userId/recently-viewed',
    [
      param('userId').isString().notEmpty(),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      validate,
    ],
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.getRecentlyViewedProducts(req, res).catch(next);
    }
  );

  // User Activity Routes
  router.post(
    '/users/:userId/activity',
    [
      param('userId').isString().notEmpty(),
      body('activityType').isString().notEmpty(),
      body('entityType').optional().isString(),
      body('entityId').optional().isString(),
      body('metadata').optional().isObject(),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.trackActivity(req, res).catch(next);
    }
  );

  router.get(
    '/users/:userId/activity',
    [
      param('userId').isString().notEmpty(),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 }),
      query('activityType').optional().isString(),
      query('entityType').optional().isString(),
      validate,
    ],
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.getActivity(req, res).catch(next);
    }
  );

  router.get(
    '/users/:userId/activity/stats',
    [
      param('userId').isString().notEmpty(),
      query('days').optional().isInt({ min: 1, max: 365 }),
      validate,
    ],
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.getActivityStats(req, res).catch(next);
    }
  );

  // Profile Completion Score Routes
  router.post(
    '/users/:userId/profile/completion-score',
    [
      param('userId').isString().notEmpty(),
      validate,
    ],
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.calculateProfileCompletionScore(req, res).catch(next);
    }
  );

  // Notification Preferences Routes
  router.get(
    '/users/:userId/notification-preferences',
    [
      param('userId').isString().notEmpty(),
      query('channel').optional().isString(),
      validate,
    ],
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.getNotificationPreferences(req, res).catch(next);
    }
  );

  router.put(
    '/users/:userId/notification-preferences',
    [
      param('userId').isString().notEmpty(),
      body('channel').isString().notEmpty(),
      body('category').isString().notEmpty(),
      body('enabled').optional().isBoolean(),
      body('frequency').optional().isIn(['realtime', 'daily', 'weekly', 'never']),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.updateNotificationPreference(req, res).catch(next);
    }
  );

  // GDPR Compliance Routes
  router.get(
    '/users/:userId/data/export',
    [
      param('userId').isString().notEmpty(),
      validate,
    ],
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.exportUserData(req, res).catch(next);
    }
  );

  router.delete(
    '/users/:userId/data',
    [
      param('userId').isString().notEmpty(),
      body('confirm').equals('DELETE').withMessage('Confirmation required'),
      validate,
    ],
    strictRateLimiter,
    requireOwnershipOrRole('admin'),
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      controller.deleteUserData(req, res).catch(next);
    }
  );

  // Admin-only routes
  router.get(
    '/admin/users',
    requireRole('admin'),
    (_req: Request, res: Response) => {
      // TODO: Implement admin list users endpoint
      res.status(501).json({ success: false, message: 'Not implemented' });
    }
  );

  return router;
}

