import { Router } from 'express';
import express from 'express';
import { PaymentController } from '../application/controllers/PaymentController';
import { authenticate } from '../middleware/auth.middleware';
import {
  validateCreatePayment,
  validateProcessPayment,
  validateRefundPayment,
  validateGetPayments,
  validateCreatePaymentMethod,
  validateProcessWebhook,
  handleValidationErrors,
} from '../middleware/validator.middleware';
import { verifyWebhookIp, webhookRateLimiter } from '../middleware/webhookSecurity.middleware';

export function createPaymentRoutes(paymentController: PaymentController): Router {
  const router = Router();

  // Payment routes (require authentication)
  router.use('/payments', authenticate);
  router.use('/payment-methods', authenticate);

  // Create payment
  router.post(
    '/payments',
    validateCreatePayment,
    handleValidationErrors,
    paymentController.createPayment.bind(paymentController)
  );

  // Process payment
  router.post(
    '/payments/:paymentId/process',
    validateProcessPayment,
    handleValidationErrors,
    paymentController.processPayment.bind(paymentController)
  );

  // Refund payment
  router.post(
    '/payments/:paymentId/refund',
    validateRefundPayment,
    handleValidationErrors,
    paymentController.refundPayment.bind(paymentController)
  );

  // Get payment by ID
  router.get('/payments/:paymentId', paymentController.getPayment.bind(paymentController));

  // Get payment by order ID
  router.get('/orders/:orderId/payment', paymentController.getPaymentByOrderId.bind(paymentController));

  // Get payments by user ID
  router.get(
    '/payments',
    validateGetPayments,
    handleValidationErrors,
    paymentController.getPaymentsByUserId.bind(paymentController)
  );

  // Payment methods
  router.post(
    '/payment-methods',
    validateCreatePaymentMethod,
    handleValidationErrors,
    paymentController.createPaymentMethod.bind(paymentController)
  );

  router.get('/payment-methods', paymentController.getPaymentMethods.bind(paymentController));

  // Webhooks (no authentication required, verified by signature and IP)
  // Webhooks need raw body for signature verification (Stripe)
  // Register webhook route with raw body parser
  router.post(
    '/webhooks',
    // Raw body parser for Stripe webhook signature verification (must be first)
    express.raw({ type: 'application/json', limit: '10mb' }),
    async (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      try {
        // Store raw body for signature verification (Stripe needs it)
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body as string);
        (req as any).rawBody = rawBody;
        
        // Parse body for processing (convert to JSON object)
        if (Buffer.isBuffer(req.body)) {
          req.body = JSON.parse(req.body.toString('utf8'));
        } else if (typeof req.body === 'string') {
          req.body = JSON.parse(req.body);
        }
        next();
      } catch (error) {
        next(error);
      }
    },
    webhookRateLimiter,
    verifyWebhookIp,
    validateProcessWebhook,
    handleValidationErrors,
    paymentController.processWebhook.bind(paymentController)
  );

  return router;
}

