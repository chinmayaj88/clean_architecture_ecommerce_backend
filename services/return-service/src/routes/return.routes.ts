import { Router } from 'express';
import { ReturnRequestController } from '../application/controllers/ReturnRequestController';
import { globalRateLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate, requireRole } from '../middleware/auth.middleware';

export function createReturnRoutes(controller: ReturnRequestController): Router {
  const router = Router();

  router.use(globalRateLimiter);

  // Create return request (authenticated)
  router.post(
    '/',
    authenticate(),
    (req, res, next) => {
      controller.createReturnRequest(req, res).catch(next);
    }
  );

  // Get return request by ID (authenticated)
  router.get(
    '/:id',
    authenticate(),
    (req, res, next) => {
      controller.getReturnRequest(req, res).catch(next);
    }
  );

  // Get return requests by user (authenticated)
  router.get(
    '/user/:userId',
    authenticate(),
    (req, res, next) => {
      controller.getReturnRequestsByUser(req, res).catch(next);
    }
  );

  // Approve return request (admin only)
  router.post(
    '/:id/approve',
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      controller.approveReturnRequest(req, res).catch(next);
    }
  );

  // Update return status (admin only)
  router.put(
    '/:id/status',
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      controller.updateReturnStatus(req, res).catch(next);
    }
  );

  // Process refund (admin only)
  router.post(
    '/:id/refund',
    authenticate(),
    requireRole('admin'),
    (req, res, next) => {
      controller.processRefund(req, res).catch(next);
    }
  );

  return router;
}

