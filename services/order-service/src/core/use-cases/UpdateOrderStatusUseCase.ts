import { IOrderRepository } from '../../ports/interfaces/IOrderRepository';
import { IOrderStatusHistoryRepository } from '../../ports/interfaces/IOrderStatusHistoryRepository';
import { IEventPublisher, OrderStatusChangedEvent, OrderPaymentStatusChangedEvent, OrderCancelledEvent, OrderShippedEvent } from '../../ports/interfaces/IEventPublisher';
import { Order, OrderStatus, PaymentStatus } from '../../core/entities/Order';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  changedBy: string;
  reason?: string | null;
}

export interface UpdatePaymentStatusInput {
  orderId: string;
  paymentStatus: PaymentStatus;
  changedBy: string;
  reason?: string | null;
}

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly orderStatusHistoryRepository: IOrderStatusHistoryRepository,
    private readonly eventPublisher?: IEventPublisher
  ) {}

  async execute(input: UpdateOrderStatusInput): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(order.status, input.status)) {
      throw new Error(`Invalid status transition from ${order.status} to ${input.status}`);
    }

    // Update order status
    const updatedOrder = await this.orderRepository.update(input.orderId, {
      status: input.status,
      ...(input.status === OrderStatus.SHIPPED && { shippedAt: new Date() }),
      ...(input.status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
      ...(input.status === OrderStatus.CANCELLED && { cancelledAt: new Date() }),
    });

    // Create status history
    await this.orderStatusHistoryRepository.create({
      orderId: input.orderId,
      status: input.status,
      previousStatus: order.status,
      changedBy: input.changedBy,
      reason: input.reason || null,
    });

    // Publish order.status.changed event
    if (this.eventPublisher) {
      try {
        const event: OrderStatusChangedEvent = {
          orderId: input.orderId,
          orderNumber: updatedOrder.orderNumber,
          previousStatus: order.status,
          newStatus: input.status,
          changedBy: input.changedBy,
          reason: input.reason || null,
          timestamp: new Date().toISOString(),
          source: 'order-service',
        };
        await this.eventPublisher.publish('order.status.changed', event);

        // Publish specific events for important status changes
        if (input.status === OrderStatus.CANCELLED) {
          const cancelEvent: OrderCancelledEvent = {
            orderId: input.orderId,
            orderNumber: updatedOrder.orderNumber,
            userId: updatedOrder.userId,
            cancelledBy: input.changedBy,
            reason: input.reason || null,
            timestamp: new Date().toISOString(),
            source: 'order-service',
          };
          await this.eventPublisher.publish('order.cancelled', cancelEvent);
        } else if (input.status === OrderStatus.SHIPPED) {
          const shipEvent: OrderShippedEvent = {
            orderId: input.orderId,
            orderNumber: updatedOrder.orderNumber,
            userId: updatedOrder.userId,
            trackingNumber: updatedOrder.trackingNumber,
            shippingMethod: updatedOrder.shippingMethod,
            timestamp: new Date().toISOString(),
            source: 'order-service',
          };
          await this.eventPublisher.publish('order.shipped', shipEvent);
        }
      } catch (error) {
        logger.error('Failed to publish order.status.changed event', {
          orderId: input.orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Order status updated', {
      orderId: input.orderId,
      previousStatus: order.status,
      newStatus: input.status,
      changedBy: input.changedBy,
    });

    return updatedOrder;
  }

  async updatePaymentStatus(input: UpdatePaymentStatusInput): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Update payment status
    const updatedOrder = await this.orderRepository.update(input.orderId, {
      paymentStatus: input.paymentStatus,
      ...(input.paymentStatus === PaymentStatus.PAID && {
        status: order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : order.status,
      }),
    });

    // Create status history if status changed
    if (updatedOrder.status !== order.status) {
      await this.orderStatusHistoryRepository.create({
        orderId: input.orderId,
        status: updatedOrder.status,
        previousStatus: order.status,
        changedBy: input.changedBy,
        reason: input.reason || 'Payment status updated',
      });
    }

    // Publish order.payment.status.changed event
    if (this.eventPublisher) {
      try {
        const event: OrderPaymentStatusChangedEvent = {
          orderId: input.orderId,
          orderNumber: updatedOrder.orderNumber,
          previousPaymentStatus: order.paymentStatus,
          newPaymentStatus: input.paymentStatus,
          changedBy: input.changedBy,
          reason: input.reason || null,
          timestamp: new Date().toISOString(),
          source: 'order-service',
        };
        await this.eventPublisher.publish('order.payment.status.changed', event);
      } catch (error) {
        logger.error('Failed to publish order.payment.status.changed event', {
          orderId: input.orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Order payment status updated', {
      orderId: input.orderId,
      previousPaymentStatus: order.paymentStatus,
      newPaymentStatus: input.paymentStatus,
      changedBy: input.changedBy,
    });

    return updatedOrder;
  }

  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

