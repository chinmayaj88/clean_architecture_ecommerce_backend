import { PrismaClient } from '@prisma/client';
import { IPaymentWebhookRepository } from '../../ports/interfaces/IPaymentWebhookRepository';
import { IPaymentRepository } from '../../ports/interfaces/IPaymentRepository';
import { IPaymentTransactionRepository } from '../../ports/interfaces/IPaymentTransactionRepository';
import { IOrderServiceClient } from '../../ports/interfaces/IOrderServiceClient';
import { IEventPublisher, PaymentSucceededEvent, PaymentFailedEvent } from '../../ports/interfaces/IEventPublisher';
import { PaymentWebhook, PaymentProvider, WebhookStatus } from '../../core/entities/PaymentWebhook';
import { PaymentStatus, PaymentProvider as PaymentProviderEnum } from '../../core/entities/Payment';
import { TransactionStatus } from '../../core/entities/PaymentTransaction';
import { getPaymentProviderByName } from '../../infrastructure/providers/PaymentProviderFactory';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();
const config = getEnvConfig();

export interface ProcessWebhookInput {
  provider: PaymentProvider;
  eventType: string;
  providerEventId: string;
  payload: Record<string, any>;
  signature?: string;
  rawBody?: string | Buffer; // Raw body for Stripe signature verification
}

export class ProcessWebhookUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentWebhookRepository: IPaymentWebhookRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentTransactionRepository: IPaymentTransactionRepository,
    private readonly orderServiceClient: IOrderServiceClient,
    private readonly eventPublisher?: IEventPublisher
  ) {}

  async execute(input: ProcessWebhookInput): Promise<PaymentWebhook> {
    // 1. Check if webhook already processed (idempotency)
    const existingWebhook = await this.paymentWebhookRepository.findByProviderEventId(input.providerEventId);
    if (existingWebhook && existingWebhook.status === WebhookStatus.PROCESSED) {
      logger.info('Webhook already processed', { providerEventId: input.providerEventId });
      return existingWebhook;
    }

    // 2. Verify webhook signature if provider supports it
    const paymentProvider = getPaymentProviderByName(input.provider);
    if (paymentProvider.verifyWebhook && input.signature) {
      try {
        const webhookSecret = this.getWebhookSecret(input.provider);
        
        // For Stripe, we need to pass the raw body (string or Buffer) for signature verification
        // The raw body should be passed from the controller
        // For PayPal, we pass the parsed payload as JSON string
        let payloadForVerification: string | Buffer;
        
        if (input.provider === PaymentProviderEnum.STRIPE) {
          // Stripe requires the raw body for signature verification
          // If payload is already a string (raw body), use it directly
          // Otherwise, try to get it from the input (should be passed from controller)
          if (typeof (input as any).rawBody === 'string' || Buffer.isBuffer((input as any).rawBody)) {
            payloadForVerification = (input as any).rawBody;
          } else if (typeof input.payload === 'string') {
            payloadForVerification = input.payload;
          } else {
            // Fallback: stringify (not ideal for Stripe, but better than nothing)
            payloadForVerification = JSON.stringify(input.payload);
          }
        } else {
          // PayPal uses parsed payload
          payloadForVerification = JSON.stringify(input.payload);
        }
        
        const verifyResponse = await paymentProvider.verifyWebhook!({
          payload: payloadForVerification,
          signature: input.signature,
          secret: webhookSecret,
        });

        if (!verifyResponse.isValid) {
          logger.warn('Invalid webhook signature', { 
            providerEventId: input.providerEventId,
            provider: input.provider,
          });
          // Create webhook record with failed status
          if (!existingWebhook) {
            return await this.paymentWebhookRepository.create({
              provider: input.provider,
              eventType: input.eventType,
              providerEventId: input.providerEventId,
              payload: input.payload,
              status: WebhookStatus.FAILED,
              error: 'Invalid signature',
            });
          }
          return existingWebhook;
        }
      } catch (error) {
        logger.error('Error verifying webhook signature', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          provider: input.provider,
        });
        // Don't fail the webhook processing if verification fails in development
        if (config.NODE_ENV === 'production') {
          throw error;
        }
      }
    }

    // 3. Create or update webhook record
    let webhook: PaymentWebhook;
    if (existingWebhook) {
      // Update existing webhook
      webhook = await this.paymentWebhookRepository.update(
        existingWebhook.id,
        WebhookStatus.PENDING,
        null,
        null
      );
    } else {
      // Create new webhook record
      webhook = await this.paymentWebhookRepository.create({
        provider: input.provider,
        eventType: input.eventType,
        providerEventId: input.providerEventId,
        payload: input.payload,
        status: WebhookStatus.PENDING,
      });
    }

    // 4. Process webhook based on event type
    try {
      await this.processWebhookEvent(webhook, input.payload);
      
      // Mark webhook as processed
      await this.paymentWebhookRepository.update(
        webhook.id,
        WebhookStatus.PROCESSED,
        null,
        new Date()
      );
    } catch (error) {
      logger.error('Error processing webhook event', {
        webhookId: webhook.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Mark webhook as failed
      await this.paymentWebhookRepository.update(
        webhook.id,
        WebhookStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error',
        null
      );
    }

    return webhook;
  }

  private async processWebhookEvent(webhook: PaymentWebhook, payload: Record<string, any>): Promise<void> {
    const eventType = payload.type || payload.event_type || webhook.eventType;

    switch (eventType) {
      case 'payment.succeeded':
      case 'charge.succeeded':
        await this.handlePaymentSucceeded(webhook, payload);
        break;
      
      case 'payment.failed':
      case 'charge.failed':
        await this.handlePaymentFailed(webhook, payload);
        break;
      
      case 'payment.refunded':
      case 'refund.succeeded':
        await this.handleRefundSucceeded(webhook, payload);
        break;
      
      default:
        logger.warn('Unknown webhook event type', { eventType, providerEventId: webhook.providerEventId });
    }
  }

  private async handlePaymentSucceeded(_webhook: PaymentWebhook, payload: Record<string, any>): Promise<void> {
    const providerPaymentId = payload.id || payload.payment_id || payload.charge_id;
    if (!providerPaymentId) {
      logger.warn('Payment succeeded webhook missing payment ID', { payload });
      return;
    }

    // Find payment by provider payment ID
    const payment = await this.paymentRepository.findByProviderPaymentId(providerPaymentId);
    if (!payment) {
      logger.warn('Payment not found for webhook', { providerPaymentId });
      return;
    }

    // Update payment status
    await this.prisma.$transaction(async () => {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.SUCCEEDED,
        processedAt: new Date(),
      });

      // Update transaction
      const transactions = await this.paymentTransactionRepository.findByPaymentId(payment.id);
      const pendingTransaction = transactions.find(t => t.status === TransactionStatus.PENDING);
      if (pendingTransaction) {
        await this.paymentTransactionRepository.update(
          pendingTransaction.id,
          TransactionStatus.SUCCEEDED,
          new Date(),
          payload
        );
      }
    });

    // Update order payment status
    try {
      await this.orderServiceClient.updatePaymentStatus({
        orderId: payment.orderId,
        paymentStatus: 'paid',
        reason: null,
      });
    } catch (error) {
      logger.error('Failed to update order payment status', { error });
    }

    // Publish event
    if (this.eventPublisher) {
      try {
        const event: PaymentSucceededEvent = {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethodId: payment.paymentMethodId,
          providerPaymentId: payment.providerPaymentId,
          timestamp: new Date().toISOString(),
          source: 'payment-service',
        };
        await this.eventPublisher.publish('payment.succeeded', event);
      } catch (error) {
        logger.error('Failed to publish payment.succeeded event', { error });
      }
    }
  }

  private async handlePaymentFailed(_webhook: PaymentWebhook, payload: Record<string, any>): Promise<void> {
    const providerPaymentId = payload.id || payload.payment_id || payload.charge_id;
    if (!providerPaymentId) {
      logger.warn('Payment failed webhook missing payment ID', { payload });
      return;
    }

    const payment = await this.paymentRepository.findByProviderPaymentId(providerPaymentId);
    if (!payment) {
      logger.warn('Payment not found for webhook', { providerPaymentId });
      return;
    }

    await this.paymentRepository.update(payment.id, {
      status: PaymentStatus.FAILED,
      processedAt: new Date(),
    });

    // Update order payment status
    try {
      await this.orderServiceClient.updatePaymentStatus({
        orderId: payment.orderId,
        paymentStatus: 'failed',
        reason: payload.error?.message || 'Payment failed',
      });
    } catch (error) {
      logger.error('Failed to update order payment status', { error });
    }

    // Publish event
    if (this.eventPublisher) {
      try {
        const event: PaymentFailedEvent = {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: payment.amount,
          currency: payment.currency,
          error: payload.error?.message || 'Payment failed',
          timestamp: new Date().toISOString(),
          source: 'payment-service',
        };
        await this.eventPublisher.publish('payment.failed', event);
      } catch (error) {
        logger.error('Failed to publish payment.failed event', { error });
      }
    }
  }

  private async handleRefundSucceeded(_webhook: PaymentWebhook, payload: Record<string, any>): Promise<void> {
    const providerRefundId = payload.id || payload.refund_id;
    const providerPaymentId = payload.payment_id || payload.charge_id;
    
    if (!providerRefundId || !providerPaymentId) {
      logger.warn('Refund webhook missing IDs', { payload });
      return;
    }

    const payment = await this.paymentRepository.findByProviderPaymentId(providerPaymentId);
    if (!payment) {
      logger.warn('Payment not found for refund webhook', { providerPaymentId });
      return;
    }

    // Update refund status (refund should already exist)
    // This is handled in the refund use case, but we update it here for webhook confirmation
    logger.info('Refund webhook received', { providerRefundId, paymentId: payment.id });
  }

  private getWebhookSecret(provider: PaymentProvider): string {
    switch (provider) {
      case PaymentProvider.STRIPE:
        return config.STRIPE_WEBHOOK_SECRET || '';
      case PaymentProvider.PAYPAL:
        return config.PAYPAL_WEBHOOK_ID || '';
      default:
        return '';
    }
  }
}

