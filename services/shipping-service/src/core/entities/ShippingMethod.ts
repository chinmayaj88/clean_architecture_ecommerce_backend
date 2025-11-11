export enum Carrier {
  FEDEX = 'fedex',
  UPS = 'ups',
  DHL = 'dhl',
  USPS = 'usps',
  CUSTOM = 'custom',
}

export enum ServiceType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
}

export class ShippingMethod {
  constructor(
    public id: string,
    public zoneId: string,
    public name: string,
    public carrier: Carrier,
    public serviceType: ServiceType,
    public basePrice: number,
    public pricePerKg: number | null,
    public pricePerItem: number | null,
    public estimatedDays: number | null,
    public isActive: boolean,
    public configuration: Record<string, any> | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): ShippingMethod {
    return new ShippingMethod(
      data.id,
      data.zoneId,
      data.name,
      data.carrier as Carrier,
      data.serviceType as ServiceType,
      Number(data.basePrice),
      data.pricePerKg ? Number(data.pricePerKg) : null,
      data.pricePerItem ? Number(data.pricePerItem) : null,
      data.estimatedDays,
      data.isActive,
      data.configuration as Record<string, any> | null,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Calculate shipping cost based on weight and item count
   */
  calculateCost(weight: number, itemCount: number, rate: number = 0): number {
    let cost = Number(this.basePrice) + rate;
    
    if (this.pricePerKg) {
      cost += weight * Number(this.pricePerKg);
    }
    
    if (this.pricePerItem) {
      cost += itemCount * Number(this.pricePerItem);
    }
    
    return cost;
  }
}

