import { PaymentWebhook, PaymentProvider, WebhookStatus } from '../../core/entities/PaymentWebhook';

export interface CreatePaymentWebhookData {
  provider: PaymentProvider;
  eventType: string;
  providerEventId: string;
  payload: Record<string, any>;
  status: WebhookStatus;
  error?: string | null;
  paymentId?: string | null;
}

export interface IPaymentWebhookRepository {
  create(webhook: CreatePaymentWebhookData): Promise<PaymentWebhook>;
  findById(id: string): Promise<PaymentWebhook | null>;
  findByProviderEventId(providerEventId: string): Promise<PaymentWebhook | null>;
  findByStatus(status: WebhookStatus, limit?: number): Promise<PaymentWebhook[]>;
  update(id: string, status: WebhookStatus, error: string | null, processedAt: Date | null): Promise<PaymentWebhook>;
}

