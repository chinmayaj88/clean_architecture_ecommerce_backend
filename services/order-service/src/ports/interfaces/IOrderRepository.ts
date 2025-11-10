import { Order, OrderStatus, PaymentStatus } from '../../core/entities/Order';

export interface CreateOrderData {
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethodId: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  estimatedDeliveryDate: Date | null;
  metadata: Record<string, any> | null;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  estimatedDeliveryDate?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  metadata?: Record<string, any> | null;
}

export interface OrderQueryOptions {
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

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface IOrderRepository {
  create(order: CreateOrderData): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByUserId(userId: string, status?: OrderStatus): Promise<Order[]>;
  findByUserIdPaginated(userId: string, options?: OrderQueryOptions): Promise<PaginatedOrders>;
  findByStatus(status: OrderStatus, limit?: number): Promise<Order[]>;
  update(id: string, data: UpdateOrderData): Promise<Order>;
  delete(id: string): Promise<void>;
}

