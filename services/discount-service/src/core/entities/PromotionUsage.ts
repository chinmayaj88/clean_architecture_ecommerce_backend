export class PromotionUsage {
  constructor(
    public id: string,
    public promotionId: string,
    public userId: string | null,
    public orderId: string | null,
    public discountAmount: number,
    public usedAt: Date,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): PromotionUsage {
    return new PromotionUsage(
      data.id,
      data.promotionId,
      data.userId,
      data.orderId,
      Number(data.discountAmount),
      data.usedAt,
      data.createdAt
    );
  }
}

