import { PaymentProvider } from '../../core/entities/Payment';

export interface ChargeRequest {
  amount: number;
  currency: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, any>;
  orderId?: string;
  userId?: string;
}

export interface ChargeResponse {
  success: boolean;
  transactionId: string;
  status: 'succeeded' | 'failed' | 'pending';
  error?: string;
  providerResponse?: Record<string, any>;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if provided, full refund if not
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
  providerResponse?: Record<string, any>;
}

export interface VerifyWebhookRequest {
  payload: string | Buffer;
  signature: string;
  secret: string;
}

export interface VerifyWebhookResponse {
  isValid: boolean;
  event?: Record<string, any>;
  error?: string;
}

export interface IPaymentProvider {
  getName(): PaymentProvider;
  charge(request: ChargeRequest): Promise<ChargeResponse>;
  refund(request: RefundRequest): Promise<RefundResponse>;
  verifyWebhook?(request: VerifyWebhookRequest): Promise<VerifyWebhookResponse>;
}

