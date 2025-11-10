import { OrderStatusHistory } from '../../core/entities/OrderStatusHistory';

export interface CreateOrderStatusHistoryData {
  orderId: string;
  status: string;
  previousStatus: string | null;
  changedBy: string;
  reason: string | null;
}

export interface IOrderStatusHistoryRepository {
  create(history: CreateOrderStatusHistoryData): Promise<OrderStatusHistory>;
  findByOrderId(orderId: string): Promise<OrderStatusHistory[]>;
  findLatestByOrderId(orderId: string): Promise<OrderStatusHistory | null>;
}

