export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  currency: string;
  paymentMethodId?: string | null;
  timestamp: string;
  source: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  timestamp: string;
  source: string;
}

export interface IEventConsumer {
  start(): Promise<void>;
  stop(): Promise<void>;
  onOrderCreated(handler: (event: OrderCreatedEvent) => Promise<void>): void;
  onOrderCancelled(handler: (event: OrderCancelledEvent) => Promise<void>): void;
}

