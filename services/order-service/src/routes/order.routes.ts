import { Router } from 'express';
import { OrderController } from '../application/controllers/OrderController';
import { authenticate } from '../middleware/auth.middleware';
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateUpdatePaymentStatus,
  validateGetOrders,
  validateCancelOrder,
  validateCreateOrderNote,
  validateUpdateOrderNote,
  handleValidationErrors,
} from '../middleware/validator.middleware';

export function createOrderRoutes(orderController: OrderController): Router {
  const router = Router();

  // All order routes require authentication
  router.use(authenticate);

  // Create order
  router.post(
    '/',
    validateCreateOrder,
    handleValidationErrors,
    orderController.createOrder.bind(orderController)
  );

  // Get orders by user ID
  router.get(
    '/',
    validateGetOrders,
    handleValidationErrors,
    orderController.getOrdersByUserId.bind(orderController)
  );

  // Get order by ID
  router.get('/:orderId', orderController.getOrder.bind(orderController));

  // Get order by order number
  router.get('/number/:orderNumber', orderController.getOrderByOrderNumber.bind(orderController));

  // Update order status
  router.patch(
    '/:orderId/status',
    validateUpdateOrderStatus,
    handleValidationErrors,
    orderController.updateOrderStatus.bind(orderController)
  );

  // Update payment status
  router.patch(
    '/:orderId/payment-status',
    validateUpdatePaymentStatus,
    handleValidationErrors,
    orderController.updatePaymentStatus.bind(orderController)
  );

  // Cancel order
  router.post(
    '/:orderId/cancel',
    validateCancelOrder,
    handleValidationErrors,
    orderController.cancelOrder.bind(orderController)
  );

  // Order notes
  router.post(
    '/:orderId/notes',
    validateCreateOrderNote,
    handleValidationErrors,
    orderController.createOrderNote.bind(orderController)
  );

  router.get('/:orderId/notes', orderController.getOrderNotes.bind(orderController));

  router.patch(
    '/notes/:noteId',
    validateUpdateOrderNote,
    handleValidationErrors,
    orderController.updateOrderNote.bind(orderController)
  );

  router.delete('/notes/:noteId', orderController.deleteOrderNote.bind(orderController));

  return router;
}

