import { Response } from 'express';
import { CreatePaymentUseCase } from '../../core/use-cases/CreatePaymentUseCase';
import { ProcessPaymentUseCase } from '../../core/use-cases/ProcessPaymentUseCase';
import { RefundPaymentUseCase } from '../../core/use-cases/RefundPaymentUseCase';
import { GetPaymentUseCase } from '../../core/use-cases/GetPaymentUseCase';
import { CreatePaymentMethodUseCase } from '../../core/use-cases/CreatePaymentMethodUseCase';
import { GetPaymentMethodsUseCase } from '../../core/use-cases/GetPaymentMethodsUseCase';
import { ProcessWebhookUseCase } from '../../core/use-cases/ProcessWebhookUseCase';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { PaymentStatus, PaymentProvider } from '../../core/entities/Payment';
import { PaymentMethodType } from '../../core/entities/PaymentMethod';

export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    private readonly getPaymentUseCase: GetPaymentUseCase,
    private readonly createPaymentMethodUseCase: CreatePaymentMethodUseCase,
    private readonly getPaymentMethodsUseCase: GetPaymentMethodsUseCase,
    private readonly processWebhookUseCase: ProcessWebhookUseCase
  ) {}

  async createPayment(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      const payment = await this.createPaymentUseCase.execute(
        {
          orderId: req.body.orderId,
          userId,
          paymentMethodId: req.body.paymentMethodId || null,
          amount: req.body.amount,
          currency: req.body.currency,
          description: req.body.description || null,
          metadata: req.body.metadata || null,
          token,
          idempotencyKey,
        },
        ipAddress,
        userAgent
      );

      sendCreated(res, 'Payment created successfully', payment);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to create payment');
    }
  }

  async processPayment(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const paymentId = req.params.paymentId;
      const token = req.headers.authorization?.replace('Bearer ', '');
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      const payment = await this.processPaymentUseCase.execute({
        paymentId,
        token,
        ipAddress,
        userAgent,
      });

      sendSuccess(res, 'Payment processed successfully', payment);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to process payment');
    }
  }

  async refundPayment(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const paymentId = req.params.paymentId;
      const token = req.headers.authorization?.replace('Bearer ', '');
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      const refund = await this.refundPaymentUseCase.execute({
        paymentId,
        amount: req.body.amount,
        reason: req.body.reason || null,
        metadata: req.body.metadata || null,
        token,
        ipAddress,
        userAgent,
      });

      sendSuccess(res, 'Payment refunded successfully', refund);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to refund payment');
    }
  }

  async getPayment(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const paymentId = req.params.paymentId;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const result = await this.getPaymentUseCase.execute(paymentId, userId);

      if (!result) {
        throw new AppError(404, 'Payment not found');
      }

      sendSuccess(res, 'Payment retrieved successfully', result);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Unauthorized to view this payment') {
        throw new AppError(403, error.message);
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get payment');
    }
  }

  async getPaymentByOrderId(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const result = await this.getPaymentUseCase.executeByOrderId(orderId, userId);

      if (!result) {
        throw new AppError(404, 'Payment not found');
      }

      sendSuccess(res, 'Payment retrieved successfully', result);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Unauthorized to view this payment') {
        throw new AppError(403, error.message);
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get payment');
    }
  }

  async getPaymentsByUserId(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      // Check if pagination is requested
      const usePagination = req.query.limit !== undefined || req.query.offset !== undefined;

      if (usePagination) {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
        const status = req.query.status as PaymentStatus | undefined;
        const paymentProvider = req.query.paymentProvider as PaymentProvider | undefined;
        const sortBy = (req.query.sortBy as 'createdAt' | 'amount' | 'status') || 'createdAt';
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
        const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;

        const result = await this.getPaymentUseCase.executeByUserIdPaginated(userId, {
          status,
          paymentProvider,
          limit,
          offset,
          sortBy,
          sortOrder,
          startDate,
          endDate,
          minAmount,
          maxAmount,
        });

        sendSuccess(res, 'Payments retrieved successfully', result);
      } else {
        // Backward compatibility: return all payments if no pagination
        const status = req.query.status as string | undefined;
        const payments = await this.getPaymentUseCase.executeByUserId(userId, status);
        sendSuccess(res, 'Payments retrieved successfully', payments);
      }
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get payments');
    }
  }

  async createPaymentMethod(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const paymentMethod = await this.createPaymentMethodUseCase.execute({
        userId,
        type: req.body.type as PaymentMethodType,
        provider: req.body.provider as PaymentProvider,
        providerToken: req.body.providerToken || null,
        last4: req.body.last4 || null,
        cardType: req.body.cardType || null,
        expiryMonth: req.body.expiryMonth || null,
        expiryYear: req.body.expiryYear || null,
        isDefault: req.body.isDefault || false,
      });

      // Return safe version (without provider token)
      const safePaymentMethod = paymentMethod.toSafeJSON();

      sendCreated(res, 'Payment method created successfully', safePaymentMethod);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to create payment method');
    }
  }

  async getPaymentMethods(req: AuthenticatedRequest & RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, 'Unauthorized');
      }

      const paymentMethods = await this.getPaymentMethodsUseCase.execute(userId);

      sendSuccess(res, 'Payment methods retrieved successfully', paymentMethods);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get payment methods');
    }
  }

  async processWebhook(req: RequestWithId, res: Response): Promise<void> {
    try {
      // Webhooks don't require authentication (they're verified by signature)
      // Get signature from headers (Stripe uses 'stripe-signature', PayPal uses 'PAYPAL-TRANSMISSION-SIG')
      const signature = 
        req.headers['stripe-signature'] as string ||
        req.headers['paypal-transmission-sig'] as string ||
        req.headers['x-signature'] as string ||
        req.headers['paypal-signature'] as string;
      
      // Get raw body for signature verification (Stripe requires raw body)
      const rawBodyForWebhook = (req as any).rawBody;
      const bodyPayload = rawBodyForWebhook 
        ? (Buffer.isBuffer(rawBodyForWebhook) ? JSON.parse(rawBodyForWebhook.toString('utf8')) : JSON.parse(rawBodyForWebhook))
        : (req.body.payload || req.body);
      
      // Determine provider from request
      // Stripe webhooks have 'stripe-signature' header
      // PayPal webhooks have 'PAYPAL-TRANSMISSION-SIG' header
      let provider = req.body.provider as PaymentProvider;
      if (!provider) {
        if (req.headers['stripe-signature']) {
          provider = PaymentProvider.STRIPE;
        } else if (req.headers['paypal-transmission-sig']) {
          provider = PaymentProvider.PAYPAL;
        } else {
          throw new AppError(400, 'Unable to determine payment provider from webhook');
        }
      }

      // Get event type and ID from payload
      const eventType = req.body.eventType || bodyPayload.type || bodyPayload.event_type;
      const providerEventId = req.body.providerEventId || bodyPayload.id || bodyPayload.event_id;
      
      const webhook = await this.processWebhookUseCase.execute({
        provider,
        eventType,
        providerEventId,
        payload: typeof bodyPayload === 'object' ? bodyPayload : JSON.parse(bodyPayload),
        signature,
        rawBody: rawBodyForWebhook ? (Buffer.isBuffer(rawBodyForWebhook) ? rawBodyForWebhook : Buffer.from(rawBodyForWebhook)) : undefined,
      });

      sendSuccess(res, 'Webhook processed successfully', webhook);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to process webhook');
    }
  }
}

