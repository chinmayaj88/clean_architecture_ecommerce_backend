import { IOrderRepository } from '../../ports/interfaces/IOrderRepository';
import { IOrderStatusHistoryRepository } from '../../ports/interfaces/IOrderStatusHistoryRepository';
import { IEventPublisher, OrderCancelledEvent } from '../../ports/interfaces/IEventPublisher';
import { Order, OrderStatus } from '../../core/entities/Order';
import { AppError } from '../../middleware/errorHandler.middleware';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface CancelOrderInput {
  orderId: string;
  cancelledBy: string;
  reason?: string | null;
}

export class CancelOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly orderStatusHistoryRepository: IOrderStatusHistoryRepository,
    private readonly eventPublisher?: IEventPublisher
  ) {}

  async execute(input: CancelOrderInput): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled()) {
      throw new AppError(400, `Order cannot be cancelled. Current status: ${order.status}`);
    }

    // Update order status
    const updatedOrder = await this.orderRepository.update(input.orderId, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    // Create status history
    await this.orderStatusHistoryRepository.create({
      orderId: input.orderId,
      status: OrderStatus.CANCELLED,
      previousStatus: order.status,
      changedBy: input.cancelledBy,
      reason: input.reason || 'Order cancelled',
    });

    // Publish order.cancelled event
    if (this.eventPublisher) {
      try {
        const event: OrderCancelledEvent = {
          orderId: input.orderId,
          orderNumber: updatedOrder.orderNumber,
          userId: updatedOrder.userId,
          cancelledBy: input.cancelledBy,
          reason: input.reason || null,
          timestamp: new Date().toISOString(),
          source: 'order-service',
        };
        await this.eventPublisher.publish('order.cancelled', event);
      } catch (error) {
        logger.error('Failed to publish order.cancelled event', {
          orderId: input.orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Order cancelled successfully', {
      orderId: input.orderId,
      cancelledBy: input.cancelledBy,
      reason: input.reason,
    });

    return updatedOrder;
  }
}

