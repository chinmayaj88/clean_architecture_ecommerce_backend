export class CouponUsage {
  constructor(
    public id: string,
    public couponId: string,
    public userId: string | null,
    public orderId: string | null,
    public discountAmount: number,
    public usedAt: Date,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): CouponUsage {
    return new CouponUsage(
      data.id,
      data.couponId,
      data.userId,
      data.orderId,
      Number(data.discountAmount),
      data.usedAt,
      data.createdAt
    );
  }
}

