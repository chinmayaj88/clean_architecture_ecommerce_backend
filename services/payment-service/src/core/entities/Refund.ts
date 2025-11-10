export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class Refund {
  constructor(
    public id: string,
    public paymentId: string,
    public orderId: string,
    public reason: string | null,
    public amount: number,
    public currency: string,
    public status: RefundStatus,
    public providerRefundId: string | null,
    public metadata: Record<string, any> | null,
    public processedAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): Refund {
    return new Refund(
      data.id,
      data.paymentId,
      data.orderId,
      data.reason,
      Number(data.amount),
      data.currency,
      data.status as RefundStatus,
      data.providerRefundId,
      data.metadata as Record<string, any> | null,
      data.processedAt,
      data.createdAt,
      data.updatedAt
    );
  }

  isCompleted(): boolean {
    return this.status === RefundStatus.COMPLETED || this.status === RefundStatus.FAILED;
  }
}

