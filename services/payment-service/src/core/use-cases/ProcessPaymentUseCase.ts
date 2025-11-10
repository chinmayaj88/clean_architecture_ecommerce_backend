import { PrismaClient } from '@prisma/client';
import { IPaymentRepository } from '../../ports/interfaces/IPaymentRepository';
import { IPaymentTransactionRepository } from '../../ports/interfaces/IPaymentTransactionRepository';
import { IOrderServiceClient } from '../../ports/interfaces/IOrderServiceClient';
import { IEventPublisher, PaymentSucceededEvent, PaymentFailedEvent } from '../../ports/interfaces/IEventPublisher';
import { Payment, PaymentStatus } from '../../core/entities/Payment';
import { TransactionStatus } from '../../core/entities/PaymentTransaction';
import { getPaymentProviderByName } from '../../infrastructure/providers/PaymentProviderFactory';
import { createLogger } from '../../infrastructure/logging/logger';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getAuditLogger } from '../../infrastructure/audit/AuditLogger';

const logger = createLogger();

export interface ProcessPaymentInput {
  paymentId: string;
  token?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ProcessPaymentUseCase {
  private auditLogger = getAuditLogger();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentTransactionRepository: IPaymentTransactionRepository,
    private readonly orderServiceClient: IOrderServiceClient,
    private readonly eventPublisher?: IEventPublisher
  ) {
    this.auditLogger = getAuditLogger(prisma);
  }

  async execute(input: ProcessPaymentInput): Promise<Payment> {
    // 1. Get payment
    const payment = await this.paymentRepository.findById(input.paymentId);
    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    // 2. Check if payment can be processed
    if (payment.status !== PaymentStatus.PENDING) {
      throw new AppError(400, `Payment cannot be processed. Current status: ${payment.status}`);
    }

    // 3. Get payment provider
    const paymentProvider = getPaymentProviderByName(payment.paymentProvider);

    // 4. Get order details
    const order = await this.orderServiceClient.getOrder(payment.orderId, input.token);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // 5. Process payment with provider (transaction)
    const updatedPayment = await this.prisma.$transaction(async () => {
      // Update payment status to processing
      await this.paymentRepository.update(input.paymentId, {
        status: PaymentStatus.PROCESSING,
      });

      // Charge payment with provider
      const chargeResponse = await paymentProvider.charge({
        amount: payment.amount,
        currency: payment.currency,
        paymentMethodId: payment.paymentMethodId || undefined,
        description: payment.description || undefined,
        metadata: payment.metadata || undefined,
        orderId: payment.orderId,
        userId: payment.userId,
      });

      // Update transaction
      const transactions = await this.paymentTransactionRepository.findByPaymentId(input.paymentId);
      const pendingTransaction = transactions.find(t => t.status === TransactionStatus.PENDING);
      if (pendingTransaction) {
        await this.paymentTransactionRepository.update(
          pendingTransaction.id,
          chargeResponse.success ? TransactionStatus.SUCCEEDED : TransactionStatus.FAILED,
          chargeResponse.success ? new Date() : null,
          chargeResponse.providerResponse || null
        );
      }

      // Update payment status
      const finalStatus = chargeResponse.success ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED;
      const updatedPayment = await this.paymentRepository.update(input.paymentId, {
        status: finalStatus,
        providerPaymentId: chargeResponse.transactionId,
        processedAt: chargeResponse.success ? new Date() : null,
        metadata: {
          ...(payment.metadata || {}),
          providerResponse: chargeResponse.providerResponse,
        },
      });

      return updatedPayment;
    });

    // 6. Update order payment status
    try {
      await this.orderServiceClient.updatePaymentStatus(
        {
          orderId: payment.orderId,
          paymentStatus: updatedPayment.status === PaymentStatus.SUCCEEDED ? 'paid' : 'failed',
          reason: updatedPayment.status === PaymentStatus.FAILED ? 'Payment processing failed' : null,
        },
        input.token
      );
    } catch (error) {
      logger.error('Failed to update order payment status', {
        orderId: payment.orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - payment is already processed
    }

    // 7. Publish event
    if (this.eventPublisher) {
      try {
        if (updatedPayment.status === PaymentStatus.SUCCEEDED) {
          const event: PaymentSucceededEvent = {
            paymentId: updatedPayment.id,
            orderId: updatedPayment.orderId,
            userId: updatedPayment.userId,
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
            paymentMethodId: updatedPayment.paymentMethodId,
            providerPaymentId: updatedPayment.providerPaymentId,
            timestamp: new Date().toISOString(),
            source: 'payment-service',
          };
          await this.eventPublisher.publish('payment.succeeded', event);
        } else {
          const event: PaymentFailedEvent = {
            paymentId: updatedPayment.id,
            orderId: updatedPayment.orderId,
            userId: updatedPayment.userId,
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
            error: 'Payment processing failed',
            timestamp: new Date().toISOString(),
            source: 'payment-service',
          };
          await this.eventPublisher.publish('payment.failed', event);
        }
      } catch (error) {
        logger.error('Failed to publish payment event', {
          paymentId: updatedPayment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Audit log
    await this.auditLogger.logPaymentProcessed({
      userId: updatedPayment.userId,
      paymentId: updatedPayment.id,
      orderId: updatedPayment.orderId,
      amount: updatedPayment.amount,
      currency: updatedPayment.currency,
      success: updatedPayment.status === PaymentStatus.SUCCEEDED,
      error: updatedPayment.status === PaymentStatus.FAILED ? 'Payment processing failed' : undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    logger.info('Payment processed', {
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
      orderId: updatedPayment.orderId,
    });

    return updatedPayment;
  }
}

