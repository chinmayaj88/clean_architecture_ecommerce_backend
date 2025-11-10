import { OrderCancelledEvent } from '../../ports/interfaces/IEventConsumer';
import { IPaymentRepository } from '../../ports/interfaces/IPaymentRepository';
import { PaymentStatus } from '../../core/entities/Payment';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export class HandleOrderCancelledEventUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async execute(event: OrderCancelledEvent): Promise<void> {
    try {
      logger.info('Handling order.cancelled event', {
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        userId: event.userId,
      });

      // Find payment for the order
      const payment = await this.paymentRepository.findByOrderId(event.orderId);
      if (!payment) {
        logger.warn('Payment not found for cancelled order', { orderId: event.orderId });
        return;
      }

      // Cancel payment if it's still pending or processing
      if (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.PROCESSING) {
        await this.paymentRepository.update(payment.id, {
          status: PaymentStatus.CANCELLED,
          processedAt: new Date(),
        });

        logger.info('Payment cancelled', {
          paymentId: payment.id,
          orderId: event.orderId,
        });
      } else {
        logger.info('Payment cannot be cancelled', {
          paymentId: payment.id,
          status: payment.status,
        });
      }
    } catch (error) {
      logger.error('Error handling order.cancelled event', {
        orderId: event.orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - event processing should be idempotent
    }
  }
}

