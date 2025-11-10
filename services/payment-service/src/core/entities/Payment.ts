export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MOCK = 'MOCK',
}

export class Payment {
  constructor(
    public id: string,
    public orderId: string,
    public userId: string,
    public paymentMethodId: string | null,
    public status: PaymentStatus,
    public paymentProvider: PaymentProvider,
    public providerPaymentId: string | null,
    public amount: number,
    public currency: string,
    public description: string | null,
    public metadata: Record<string, any> | null,
    public processedAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): Payment {
    return new Payment(
      data.id,
      data.orderId,
      data.userId,
      data.paymentMethodId,
      data.status as PaymentStatus,
      data.paymentProvider as PaymentProvider,
      data.providerPaymentId,
      Number(data.amount),
      data.currency,
      data.description,
      data.metadata as Record<string, any> | null,
      data.processedAt,
      data.createdAt,
      data.updatedAt
    );
  }

  canBeRefunded(): boolean {
    return this.status === PaymentStatus.SUCCEEDED;
  }

  canBeCancelled(): boolean {
    return this.status === PaymentStatus.PENDING || this.status === PaymentStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.status === PaymentStatus.SUCCEEDED || 
           this.status === PaymentStatus.FAILED || 
           this.status === PaymentStatus.CANCELLED ||
           this.status === PaymentStatus.REFUNDED;
  }
}

