export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MOCK = 'MOCK',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export class PaymentWebhook {
  constructor(
    public id: string,
    public provider: PaymentProvider,
    public eventType: string,
    public providerEventId: string,
    public payload: Record<string, any>,
    public status: WebhookStatus,
    public error: string | null,
    public processedAt: Date | null,
    public createdAt: Date,
    public paymentId: string | null
  ) {}

  static fromPrisma(data: any): PaymentWebhook {
    return new PaymentWebhook(
      data.id,
      data.provider as PaymentProvider,
      data.eventType,
      data.providerEventId,
      data.payload as Record<string, any>,
      data.status as WebhookStatus,
      data.error,
      data.processedAt,
      data.createdAt,
      data.paymentId
    );
  }
}

