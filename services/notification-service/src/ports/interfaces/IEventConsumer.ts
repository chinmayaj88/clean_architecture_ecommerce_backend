export interface IEventConsumer {
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(eventType: string, handler: (event: any) => Promise<void>): void;
  isRunning(): boolean;
}

// Event schemas from other services
export interface UserCreatedEvent {
  userId: string;
  email: string;
  timestamp: string;
  source: string;
}

export interface EmailVerificationRequestedEvent {
  userId: string;
  email: string;
  verificationToken: string;
  expiresAt: string;
  timestamp: string;
  source: string;
}

export interface PasswordResetRequestedEvent {
  userId: string;
  email: string;
  resetToken: string;
  expiresAt: string;
  timestamp: string;
  source: string;
}

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  timestamp: string;
  source: string;
}

export interface OrderShippedEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  trackingNumber: string | null;
  shippingMethod: string | null;
  timestamp: string;
  source: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  cancelledBy: string;
  reason?: string | null;
  timestamp: string;
  source: string;
}

export interface OrderDeliveredEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  deliveredAt: string;
  trackingNumber?: string | null;
  timestamp: string;
  source: string;
}

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



