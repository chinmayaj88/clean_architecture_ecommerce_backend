import { IOrderRepository } from '../../ports/interfaces/IOrderRepository';
import { IOrderItemRepository } from '../../ports/interfaces/IOrderItemRepository';
import { IOrderShippingAddressRepository } from '../../ports/interfaces/IOrderShippingAddressRepository';
import { IOrderStatusHistoryRepository } from '../../ports/interfaces/IOrderStatusHistoryRepository';
import { Order, OrderStatus, PaymentStatus } from '../../core/entities/Order';
import { OrderItem } from '../../core/entities/OrderItem';
import { OrderShippingAddress } from '../../core/entities/OrderShippingAddress';
import { OrderStatusHistory } from '../../core/entities/OrderStatusHistory';

export interface OrderDetails {
  order: Order;
  items: OrderItem[];
  shippingAddress: OrderShippingAddress | null;
  statusHistory: OrderStatusHistory[];
}

export class GetOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly orderItemRepository: IOrderItemRepository,
    private readonly orderShippingAddressRepository: IOrderShippingAddressRepository,
    private readonly orderStatusHistoryRepository: IOrderStatusHistoryRepository
  ) {}

  async execute(orderId: string, userId?: string): Promise<OrderDetails | null> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      return null;
    }

    // Check if user has permission to view this order
    if (userId && order.userId !== userId) {
      throw new Error('Unauthorized to view this order');
    }

    const items = await this.orderItemRepository.findByOrderId(orderId);
    const shippingAddress = await this.orderShippingAddressRepository.findByOrderId(orderId);
    const statusHistory = await this.orderStatusHistoryRepository.findByOrderId(orderId);

    return {
      order,
      items,
      shippingAddress,
      statusHistory,
    };
  }

  async executeByOrderNumber(orderNumber: string, userId?: string): Promise<OrderDetails | null> {
    const order = await this.orderRepository.findByOrderNumber(orderNumber);

    if (!order) {
      return null;
    }

    // Check if user has permission to view this order
    if (userId && order.userId !== userId) {
      throw new Error('Unauthorized to view this order');
    }

    const items = await this.orderItemRepository.findByOrderId(order.id);
    const shippingAddress = await this.orderShippingAddressRepository.findByOrderId(order.id);
    const statusHistory = await this.orderStatusHistoryRepository.findByOrderId(order.id);

    return {
      order,
      items,
      shippingAddress,
      statusHistory,
    };
  }

  async executeByUserId(userId: string, status?: OrderStatus): Promise<Order[]> {
    return await this.orderRepository.findByUserId(userId, status);
  }

  async executeByUserIdPaginated(
    userId: string,
    options?: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'totalAmount' | 'status';
      sortOrder?: 'asc' | 'desc';
      startDate?: Date;
      endDate?: Date;
      minAmount?: number;
      maxAmount?: number;
    }
  ) {
    return await this.orderRepository.findByUserIdPaginated(userId, options);
  }
}

