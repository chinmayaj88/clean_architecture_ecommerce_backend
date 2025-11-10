import { PrismaClient } from '@prisma/client';
import { IPaymentRepository } from '../../ports/interfaces/IPaymentRepository';
import { IPaymentTransactionRepository } from '../../ports/interfaces/IPaymentTransactionRepository';
import { IRefundRepository } from '../../ports/interfaces/IRefundRepository';
import { IOrderServiceClient } from '../../ports/interfaces/IOrderServiceClient';
import { IEventPublisher, PaymentRefundedEvent } from '../../ports/interfaces/IEventPublisher';
import { PaymentStatus } from '../../core/entities/Payment';
import { Refund, RefundStatus } from '../../core/entities/Refund';
import { TransactionType, TransactionStatus } from '../../core/entities/PaymentTransaction';
import { getPaymentProviderByName } from '../../infrastructure/providers/PaymentProviderFactory';
import { createLogger } from '../../infrastructure/logging/logger';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getAuditLogger } from '../../infrastructure/audit/AuditLogger';

const logger = createLogger();

export interface RefundPaymentInput {
  paymentId: string;
  amount?: number; // Partial refund if provided, full refund if not
  reason?: string | null;
  metadata?: Record<string, any> | null;
  token?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class RefundPaymentUseCase {
  private auditLogger = getAuditLogger();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentTransactionRepository: IPaymentTransactionRepository,
    private readonly refundRepository: IRefundRepository,
    private readonly orderServiceClient: IOrderServiceClient,
    private readonly eventPublisher?: IEventPublisher
  ) {
    this.auditLogger = getAuditLogger(prisma);
  }

  async execute(input: RefundPaymentInput): Promise<Refund> {
    // 1. Get payment
    const payment = await this.paymentRepository.findById(input.paymentId);
    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    // 2. Check if payment can be refunded
    if (!payment.canBeRefunded()) {
      throw new AppError(400, `Payment cannot be refunded. Current status: ${payment.status}`);
    }

    // 3. Determine refund amount
    const refundAmount = input.amount || payment.amount;
    if (refundAmount > payment.amount) {
      throw new AppError(400, `Refund amount (${refundAmount}) cannot exceed payment amount (${payment.amount})`);
    }

    // 4. Check existing refunds
    const existingRefunds = await this.refundRepository.findByPaymentId(input.paymentId);
    const totalRefunded = existingRefunds
      .filter(r => r.status === RefundStatus.COMPLETED)
      .reduce((sum, r) => sum + r.amount, 0);
    
    if (totalRefunded + refundAmount > payment.amount) {
      throw new AppError(400, `Total refund amount (${totalRefunded + refundAmount}) cannot exceed payment amount (${payment.amount})`);
    }

    // 5. Get payment provider
    const paymentProvider = getPaymentProviderByName(payment.paymentProvider);

    // 6. Process refund with provider (transaction)
    const refund = await this.prisma.$transaction(async () => {
      // Create refund record
      const refundData = {
        paymentId: input.paymentId,
        orderId: payment.orderId,
        reason: input.reason || null,
        amount: refundAmount,
        currency: payment.currency,
        status: RefundStatus.PENDING,
        providerRefundId: null,
        metadata: input.metadata || null,
      };

      const refund = await this.refundRepository.create(refundData);

      // Process refund with provider
      const refundResponse = await paymentProvider.refund({
        paymentId: payment.providerPaymentId || input.paymentId,
        amount: refundAmount,
        reason: input.reason || undefined,
        metadata: {
          ...(input.metadata || {}),
          currency: payment.currency, // Pass currency from payment
        },
      });

      // Update refund status
      const updatedRefund = await this.refundRepository.update(refund.id, {
        status: refundResponse.success ? RefundStatus.COMPLETED : RefundStatus.FAILED,
        providerRefundId: refundResponse.refundId,
        processedAt: refundResponse.success ? new Date() : null,
        metadata: {
          ...(input.metadata || {}),
          providerResponse: refundResponse.providerResponse,
        },
      });

      // If full refund, update payment status
      if (refundResponse.success && refundAmount === payment.amount) {
        await this.paymentRepository.update(input.paymentId, {
          status: PaymentStatus.REFUNDED,
        });
      }

      // Create refund transaction
      await this.paymentTransactionRepository.create({
        paymentId: input.paymentId,
        transactionType: TransactionType.REFUND,
        status: refundResponse.success ? TransactionStatus.SUCCEEDED : TransactionStatus.FAILED,
        providerTransactionId: refundResponse.refundId,
        amount: refundAmount,
        currency: payment.currency,
        providerResponse: refundResponse.providerResponse || null,
      });

      return updatedRefund;
    });

    // 7. Update order payment status if full refund
    if (refund.status === RefundStatus.COMPLETED && refundAmount === payment.amount) {
      try {
        await this.orderServiceClient.updatePaymentStatus(
          {
            orderId: payment.orderId,
            paymentStatus: 'refunded',
            reason: input.reason || 'Full refund processed',
          },
          input.token
        );
      } catch (error) {
        logger.error('Failed to update order payment status', {
          orderId: payment.orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 8. Publish event
    if (this.eventPublisher && refund.status === RefundStatus.COMPLETED) {
      try {
        const event: PaymentRefundedEvent = {
          paymentId: input.paymentId,
          refundId: refund.id,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: refund.amount,
          currency: refund.currency,
          reason: refund.reason,
          timestamp: new Date().toISOString(),
          source: 'payment-service',
        };
        await this.eventPublisher.publish('payment.refunded', event);
      } catch (error) {
        logger.error('Failed to publish refund event', {
          refundId: refund.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Audit log
    await this.auditLogger.logRefund({
      userId: payment.userId,
      paymentId: input.paymentId,
      orderId: payment.orderId,
      refundId: refund.id,
      amount: refundAmount,
      currency: refund.currency,
      reason: refund.reason || undefined,
      success: refund.status === RefundStatus.COMPLETED,
      error: refund.status === RefundStatus.FAILED ? 'Refund processing failed' : undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    logger.info('Payment refunded', {
      refundId: refund.id,
      paymentId: input.paymentId,
      amount: refundAmount,
      status: refund.status,
    });

    return refund;
  }
}

