import Stripe from 'stripe';
import { IPaymentProvider, ChargeRequest, ChargeResponse, RefundRequest, RefundResponse, VerifyWebhookRequest, VerifyWebhookResponse } from '../../ports/interfaces/IPaymentProvider';
import { PaymentProvider } from '../../core/entities/Payment';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();
const config = getEnvConfig();

export class StripePaymentProvider implements IPaymentProvider {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    if (!config.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required for Stripe payment provider');
    }

    this.stripe = new Stripe(config.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });

    this.webhookSecret = config.STRIPE_WEBHOOK_SECRET || '';
    
    if (!this.webhookSecret) {
      logger.warn('STRIPE_WEBHOOK_SECRET not configured. Webhook signature verification will fail.');
    }
  }

  getName(): PaymentProvider {
    return PaymentProvider.STRIPE;
  }

  async charge(request: ChargeRequest): Promise<ChargeResponse> {
    try {
      logger.info('Processing Stripe charge', {
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
        paymentMethodId: request.paymentMethodId,
      });

      // Convert amount to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(request.amount * 100);

      // If payment method ID is provided, create a PaymentIntent
      if (request.paymentMethodId) {
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: amountInCents,
          currency: request.currency.toLowerCase(),
          payment_method: request.paymentMethodId,
          confirm: true,
          description: request.description || `Payment for order ${request.orderId}`,
          metadata: {
            orderId: request.orderId || '',
            userId: request.userId || '',
            ...(request.metadata || {}),
          },
          return_url: undefined, // Not needed for server-side confirmation
        });

        const isSucceeded = paymentIntent.status === 'succeeded';
        const isRequiresAction = paymentIntent.status === 'requires_action' || 
                                  paymentIntent.status === 'requires_payment_method';

        return {
          success: isSucceeded,
          transactionId: paymentIntent.id,
          status: isSucceeded ? 'succeeded' : isRequiresAction ? 'pending' : 'failed',
          error: isSucceeded ? undefined : paymentIntent.last_payment_error?.message || 'Payment failed',
          providerResponse: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            client_secret: paymentIntent.client_secret,
            last_payment_error: paymentIntent.last_payment_error,
          },
        };
      }

      // If no payment method, create a PaymentIntent for client-side confirmation
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: request.currency.toLowerCase(),
        description: request.description || `Payment for order ${request.orderId}`,
        metadata: {
          orderId: request.orderId || '',
          userId: request.userId || '',
          ...(request.metadata || {}),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: false,
        transactionId: paymentIntent.id,
        status: 'pending',
        error: 'Payment method required. Use client_secret to confirm payment on client side.',
        providerResponse: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      };
    } catch (error) {
      logger.error('Stripe charge failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId: request.orderId,
        amount: request.amount,
      });

      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          transactionId: error.payment_intent?.id || `error_${Date.now()}`,
          status: 'failed',
          error: error.message,
          providerResponse: {
            type: error.type,
            code: error.code,
            message: error.message,
            decline_code: (error as any).decline_code,
            payment_intent: error.payment_intent,
          },
        };
      }

      return {
        success: false,
        transactionId: `error_${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        providerResponse: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    try {
      logger.info('Processing Stripe refund', {
        paymentId: request.paymentId,
        amount: request.amount,
      });

      // Stripe refunds are created on the charge, not the payment intent
      // The paymentId should be the charge ID from the original payment
      // If it's a payment intent ID, we need to get the charge ID first
      let chargeId: string = request.paymentId;

      // Try to get charge from payment intent if paymentId is a payment intent
      try {
        // Check if it's a payment intent by trying to retrieve it
        await this.stripe.paymentIntents.retrieve(request.paymentId);
        // If successful, list charges for this payment intent
        const charges = await this.stripe.charges.list({
          payment_intent: request.paymentId,
          limit: 1,
        });
        if (charges.data && charges.data.length > 0) {
          chargeId = charges.data[0].id;
        }
        // If no charges found, the paymentId might already be a charge ID, use it as is
      } catch (error) {
        // If it's not a payment intent, assume it's a charge ID and use it directly
        chargeId = request.paymentId;
      }

      // Create refund
      const refundParams: Stripe.RefundCreateParams = {
        charge: chargeId,
      };

      // If amount is provided, it's a partial refund
      if (request.amount) {
        refundParams.amount = Math.round(request.amount * 100); // Convert to cents
      }

      if (request.reason) {
        refundParams.reason = request.reason as Stripe.RefundCreateParams.Reason;
      }

      if (request.metadata) {
        refundParams.metadata = request.metadata;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      const isCompleted = refund.status === 'succeeded';
      const isPending = refund.status === 'pending';

      return {
        success: isCompleted,
        refundId: refund.id,
        status: isCompleted ? 'completed' : isPending ? 'pending' : 'failed',
        error: isCompleted ? undefined : refund.failure_reason || 'Refund failed',
        providerResponse: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          charge: refund.charge,
          reason: refund.reason,
          receipt_number: refund.receipt_number,
          failure_reason: refund.failure_reason,
        },
      };
    } catch (error) {
      logger.error('Stripe refund failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId: request.paymentId,
        amount: request.amount,
      });

      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          refundId: `error_${Date.now()}`,
          status: 'failed',
          error: error.message,
          providerResponse: {
            type: error.type,
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        success: false,
        refundId: `error_${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        providerResponse: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async verifyWebhook(request: VerifyWebhookRequest): Promise<VerifyWebhookResponse> {
    try {
      if (!this.webhookSecret) {
        logger.error('Stripe webhook secret not configured');
        return {
          isValid: false,
          error: 'Webhook secret not configured',
        };
      }

      // Stripe expects the raw body as a Buffer or string
      // The payload should be the raw body string (not parsed JSON)
      let payload: string | Buffer;
      
      if (typeof request.payload === 'string') {
        payload = request.payload;
      } else if (Buffer.isBuffer(request.payload)) {
        payload = request.payload;
      } else {
        // If it's already an object, stringify it (this shouldn't happen for Stripe)
        payload = JSON.stringify(request.payload);
      }

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        payload,
        request.signature,
        request.secret || this.webhookSecret
      );

      logger.info('Stripe webhook verified successfully', {
        eventId: event.id,
        eventType: event.type,
      });

      return {
        isValid: true,
        event: {
          id: event.id,
          type: event.type,
          data: event.data,
          created: event.created,
          livemode: event.livemode,
        },
      };
    } catch (error) {
      logger.error('Stripe webhook verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      });

      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Webhook verification failed',
      };
    }
  }
}

