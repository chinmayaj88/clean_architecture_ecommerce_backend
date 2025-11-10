export interface PaymentSucceededEvent {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string | null;
  providerPaymentId?: string | null;
  timestamp: string;
  source: string;
}

export interface PaymentFailedEvent {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  error: string;
  timestamp: string;
  source: string;
}

export interface PaymentRefundedEvent {
  paymentId: string;
  refundId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  reason?: string | null;
  timestamp: string;
  source: string;
}

export interface IEventPublisher {
  publish(eventType: string, event: Record<string, any>): Promise<void>;
}

