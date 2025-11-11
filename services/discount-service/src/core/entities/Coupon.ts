export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export class Coupon {
  constructor(
    public id: string,
    public code: string,
    public name: string,
    public description: string | null,
    public type: CouponType,
    public discountValue: number,
    public minimumAmount: number,
    public maximumDiscount: number | null,
    public currency: string,
    public usageLimit: number | null,
    public usageCount: number,
    public usageLimitPerUser: number | null,
    public startsAt: Date | null,
    public endsAt: Date | null,
    public isActive: boolean,
    public applicableProducts: string[] | null,
    public applicableCategories: string[] | null,
    public excludedProducts: string[] | null,
    public metadata: Record<string, any> | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): Coupon {
    return new Coupon(
      data.id,
      data.code,
      data.name,
      data.description,
      data.type as CouponType,
      Number(data.discountValue),
      Number(data.minimumAmount),
      data.maximumDiscount ? Number(data.maximumDiscount) : null,
      data.currency,
      data.usageLimit,
      data.usageCount,
      data.usageLimitPerUser,
      data.startsAt,
      data.endsAt,
      data.isActive,
      data.applicableProducts as string[] | null,
      data.applicableCategories as string[] | null,
      data.excludedProducts as string[] | null,
      data.metadata as Record<string, any> | null,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Check if coupon is currently valid (active and within date range)
   */
  isValid(): boolean {
    if (!this.isActive) {
      return false;
    }

    const now = new Date();
    if (this.startsAt && now < this.startsAt) {
      return false;
    }
    if (this.endsAt && now > this.endsAt) {
      return false;
    }

    if (this.usageLimit !== null && this.usageCount >= this.usageLimit) {
      return false;
    }

    return true;
  }

  /**
   * Check if coupon can be used by user (per-user limit check)
   */
  canBeUsedByUser(userUsageCount: number): boolean {
    if (this.usageLimitPerUser === null) {
      return true;
    }
    return userUsageCount < this.usageLimitPerUser;
  }

  /**
   * Check if order amount meets minimum requirement
   */
  meetsMinimumAmount(orderAmount: number): boolean {
    return orderAmount >= this.minimumAmount;
  }

  /**
   * Check if product is applicable for this coupon
   */
  isProductApplicable(productId: string, categoryIds: string[]): boolean {
    // Check excluded products
    if (this.excludedProducts && this.excludedProducts.includes(productId)) {
      return false;
    }

    // If no restrictions, all products are applicable
    if (!this.applicableProducts && !this.applicableCategories) {
      return true;
    }

    // Check applicable products
    if (this.applicableProducts && this.applicableProducts.includes(productId)) {
      return true;
    }

    // Check applicable categories
    if (this.applicableCategories) {
      return categoryIds.some(catId => this.applicableCategories!.includes(catId));
    }

    return false;
  }
}

