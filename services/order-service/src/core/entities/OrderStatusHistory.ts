export class OrderStatusHistory {
  constructor(
    public id: string,
    public orderId: string,
    public status: string,
    public previousStatus: string | null,
    public changedBy: string,
    public reason: string | null,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): OrderStatusHistory {
    return new OrderStatusHistory(
      data.id,
      data.orderId,
      data.status,
      data.previousStatus,
      data.changedBy,
      data.reason,
      data.createdAt
    );
  }
}

