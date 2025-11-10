export interface IEventPublisher {
  publish(topic: string, event: Record<string, unknown>): Promise<void>;
}

export interface OrderCreatedEvent extends Record<string, unknown> {
  orderId: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  timestamp: string;
  source: 'order-service';
}

export interface OrderStatusChangedEvent extends Record<string, unknown> {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  reason?: string | null;
  timestamp: string;
  source: 'order-service';
}

export interface OrderPaymentStatusChangedEvent extends Record<string, unknown> {
  orderId: string;
  orderNumber: string;
  previousPaymentStatus: string;
  newPaymentStatus: string;
  changedBy: string;
  reason?: string | null;
  timestamp: string;
  source: 'order-service';
}

export interface OrderCancelledEvent extends Record<string, unknown> {
  orderId: string;
  orderNumber: string;
  userId: string;
  cancelledBy: string;
  reason?: string | null;
  timestamp: string;
  source: 'order-service';
}

export interface OrderShippedEvent extends Record<string, unknown> {
  orderId: string;
  orderNumber: string;
  userId: string;
  trackingNumber: string | null;
  shippingMethod: string | null;
  timestamp: string;
  source: 'order-service';
}

