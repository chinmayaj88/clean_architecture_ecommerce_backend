import { OrderCreatedEvent } from '../../ports/interfaces/IEventConsumer';
import { CreatePaymentUseCase, CreatePaymentInput } from './CreatePaymentUseCase';
import { ProcessPaymentUseCase, ProcessPaymentInput } from './ProcessPaymentUseCase';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export class HandleOrderCreatedEventUseCase {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase
  ) {}

  async execute(event: OrderCreatedEvent): Promise<void> {
    try {
      logger.info('Handling order.created event', {
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        userId: event.userId,
      });

      // Create payment for the order
      const createPaymentInput: CreatePaymentInput = {
        orderId: event.orderId,
        userId: event.userId,
        paymentMethodId: event.paymentMethodId || null,
        amount: event.totalAmount,
        currency: event.currency,
        description: `Payment for order ${event.orderNumber}`,
        metadata: {
          orderNumber: event.orderNumber,
          source: 'order-created-event',
        },
      };

      const payment = await this.createPaymentUseCase.execute(createPaymentInput);

      // Automatically process the payment
      const processPaymentInput: ProcessPaymentInput = {
        paymentId: payment.id,
      };

      await this.processPaymentUseCase.execute(processPaymentInput);

      logger.info('Payment created and processed for order', {
        orderId: event.orderId,
        paymentId: payment.id,
      });
    } catch (error) {
      logger.error('Error handling order.created event', {
        orderId: event.orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - event processing should be idempotent
    }
  }
}

