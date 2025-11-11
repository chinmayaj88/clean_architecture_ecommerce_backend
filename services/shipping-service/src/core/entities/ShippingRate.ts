export class ShippingRate {
  constructor(
    public id: string,
    public methodId: string,
    public minWeight: number,
    public maxWeight: number | null,
    public minAmount: number,
    public maxAmount: number | null,
    public rate: number,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): ShippingRate {
    return new ShippingRate(
      data.id,
      data.methodId,
      Number(data.minWeight),
      data.maxWeight ? Number(data.maxWeight) : null,
      Number(data.minAmount),
      data.maxAmount ? Number(data.maxAmount) : null,
      Number(data.rate),
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Check if this rate matches the given weight and order amount
   */
  matches(weight: number, orderAmount: number): boolean {
    // Check weight range
    if (weight < this.minWeight) {
      return false;
    }
    if (this.maxWeight !== null && weight > this.maxWeight) {
      return false;
    }

    // Check order amount range
    if (orderAmount < this.minAmount) {
      return false;
    }
    if (this.maxAmount !== null && orderAmount > this.maxAmount) {
      return false;
    }

    return true;
  }
}

