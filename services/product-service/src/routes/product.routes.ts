import { Router } from 'express';
import { body, query } from 'express-validator';
import { ProductController } from '../application/controllers/ProductController';
import { validate } from '../middleware/validator.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { productRateLimiter, productWriteRateLimiter } from '../middleware/rateLimiter.middleware';

export function createProductRoutes(controller: ProductController): Router {
  const router = Router();

  // Public routes (read-only, no auth required)
  router.get(
    '/',
    productRateLimiter,
    validate([
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    ]),
    (req, res, next) => {
      controller.list(req, res).catch(next);
    }
  );

  router.get('/:id', productRateLimiter, (req, res, next) => {
    controller.getById(req, res).catch(next);
  });

  // Search route
  router.get(
    '/search',
    productRateLimiter,
    validate([
      query('q').notEmpty().withMessage('Search query is required'),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
    ]),
    (req, res, next) => {
      controller.search(req, res).catch(next);
    }
  );

  // Recommendations route
  router.get('/:id/recommendations', productRateLimiter, (req, res, next) => {
    controller.getRecommendations(req, res).catch(next);
  });

  // Track view route
  router.post('/:id/view', productRateLimiter, (req, res, next) => {
    controller.trackView(req, res).catch(next);
  });

  // Product Questions routes
  router.get('/:id/questions', productRateLimiter, (req, res, next) => {
    controller.getQuestions(req, res).catch(next);
  });

  router.post(
    '/:id/questions',
    productWriteRateLimiter,
    authenticate(),
    validate([
      body('question').notEmpty().withMessage('Question is required'),
    ]),
    (req, res, next) => {
      controller.createQuestion(req, res).catch(next);
    }
  );

  router.post(
    '/questions/:questionId/answer',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    validate([
      body('answer').notEmpty().withMessage('Answer is required'),
    ]),
    (req, res, next) => {
      controller.answerQuestion(req, res).catch(next);
    }
  );

  // Stock Alert routes
  router.get(
    '/stock-alerts',
    productRateLimiter,
    authenticate(),
    (req, res, next) => {
      controller.getStockAlerts(req, res).catch(next);
    }
  );

  router.post(
    '/:id/stock-alerts',
    productWriteRateLimiter,
    authenticate(),
    validate([
      body('email').isEmail().withMessage('Valid email is required'),
    ]),
    (req, res, next) => {
      controller.createStockAlert(req, res).catch(next);
    }
  );

  // Product Reviews Routes
  router.post(
    '/:id/reviews',
    productWriteRateLimiter,
    authenticate(),
    validate([
      body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
      body('title').optional().isString(),
      body('comment').optional().isString(),
    ]),
    (req, res, next) => {
      controller.createReview(req, res).catch(next);
    }
  );

  router.get(
    '/:id/reviews',
    productRateLimiter,
    validate([
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 }),
      query('isApproved').optional().isBoolean(),
      query('rating').optional().isInt({ min: 1, max: 5 }),
      query('sortBy').optional().isIn(['newest', 'oldest', 'rating', 'helpful']),
    ]),
    (req, res, next) => {
      controller.getReviews(req, res).catch(next);
    }
  );

  // Review Moderation Routes (Admin only)
  router.get(
    '/reviews/pending',
    productRateLimiter,
    authenticate(),
    requireRole('admin'),
    validate([
      query('limit').optional().isInt({ min: 1, max: 100 }),
    ]),
    (req, res, next) => {
      controller.getPendingReviews(req, res).catch(next);
    }
  );

  router.post(
    '/reviews/:reviewId/moderate',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    validate([
      body('action').isIn(['approve', 'reject']).withMessage('Action must be "approve" or "reject"'),
    ]),
    (req, res, next) => {
      controller.moderateReview(req, res).catch(next);
    }
  );

  // Product Comparison Routes
  router.post(
    '/comparisons',
    productWriteRateLimiter,
    authenticate(),
    validate([
      body('productIds').isArray({ min: 2, max: 4 }).withMessage('2-4 product IDs required'),
      body('name').optional().isString(),
    ]),
    (req, res, next) => {
      controller.createComparison(req, res).catch(next);
    }
  );

  router.get(
    '/comparisons',
    productRateLimiter,
    authenticate(),
    (req, res, next) => {
      controller.getUserComparisons(req, res).catch(next);
    }
  );

  router.get(
    '/comparisons/:comparisonId',
    productRateLimiter,
    authenticate(),
    (req, res, next) => {
      controller.getComparison(req, res).catch(next);
    }
  );

  // Product Badges Routes (Admin only)
  router.put(
    '/:id/badges',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    validate([
      body('action').isIn(['add', 'remove', 'set']).withMessage('Action must be "add", "remove", or "set"'),
      body('badge').optional().isString(),
      body('badges').optional().isArray(),
    ]),
    (req, res, next) => {
      controller.updateBadges(req, res).catch(next);
    }
  );

  // Protected routes (write operations require admin role)
  router.post(
    '/',
    productWriteRateLimiter,
    authenticate(),
    requireRole('admin'),
    validate([
      body('sku').notEmpty().withMessage('SKU is required'),
      body('name').notEmpty().withMessage('Name is required'),
      body('slug').notEmpty().withMessage('Slug is required'),
      body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
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
      body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
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

  // Price History Routes
  router.get(
    '/:id/price-history',
    productRateLimiter,
    validate([
      query('limit').optional().isInt({ min: 1, max: 100 }),
    ]),
    (req, res, next) => {
      controller.getPriceHistory(req, res).catch(next);
    }
  );

  // Search History Routes
  router.get(
    '/search-history',
    productRateLimiter,
    authenticate(),
    validate([
      query('limit').optional().isInt({ min: 1, max: 100 }),
    ]),
    (req, res, next) => {
      controller.getSearchHistory(req, res).catch(next);
    }
  );

  router.get(
    '/search-history/popular',
    productRateLimiter,
    validate([
      query('limit').optional().isInt({ min: 1, max: 50 }),
    ]),
    (req, res, next) => {
      controller.getPopularSearches(req, res).catch(next);
    }
  );

  return router;
}

