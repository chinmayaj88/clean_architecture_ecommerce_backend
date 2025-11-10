export enum TransactionType {
  CHARGE = 'CHARGE',
  REFUND = 'REFUND',
  VOID = 'VOID',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export class PaymentTransaction {
  constructor(
    public id: string,
    public paymentId: string,
    public transactionType: TransactionType,
    public status: TransactionStatus,
    public providerTransactionId: string | null,
    public amount: number,
    public currency: string,
    public providerResponse: Record<string, any> | null,
    public processedAt: Date | null,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): PaymentTransaction {
    return new PaymentTransaction(
      data.id,
      data.paymentId,
      data.transactionType as TransactionType,
      data.status as TransactionStatus,
      data.providerTransactionId,
      Number(data.amount),
      data.currency,
      data.providerResponse as Record<string, any> | null,
      data.processedAt,
      data.createdAt
    );
  }
}

