export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  CONVERTED = 'converted',
}

export class Cart {
  constructor(
    public id: string,
    public userId: string | null,
    public sessionId: string | null,
    public status: CartStatus,
    public currency: string,
    public subtotal: number,
    public taxAmount: number,
    public shippingAmount: number,
    public discountAmount: number,
    public totalAmount: number,
    public couponCode: string | null,
    public metadata: Record<string, any> | null,
    public expiresAt: Date | null,
    public convertedAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): Cart {
    return new Cart(
      data.id,
      data.userId,
      data.sessionId,
      data.status as CartStatus,
      data.currency,
      Number(data.subtotal),
      Number(data.taxAmount),
      Number(data.shippingAmount),
      Number(data.discountAmount),
      Number(data.totalAmount),
      data.couponCode,
      data.metadata as Record<string, any> | null,
      data.expiresAt,
      data.convertedAt,
      data.createdAt,
      data.updatedAt
    );
  }

  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  isActive(): boolean {
    return this.status === CartStatus.ACTIVE && !this.isExpired();
  }

  canBeModified(): boolean {
    return this.status === CartStatus.ACTIVE && !this.isExpired();
  }
}

