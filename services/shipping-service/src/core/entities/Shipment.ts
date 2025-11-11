export enum ShipmentStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  EXCEPTION = 'exception',
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  name?: string;
  phone?: string;
}

export class Shipment {
  constructor(
    public id: string,
    public orderId: string,
    public carrierId: string | null,
    public methodId: string | null,
    public trackingNumber: string,
    public status: ShipmentStatus,
    public weight: number,
    public cost: number,
    public originAddress: Address,
    public destinationAddress: Address,
    public shippedAt: Date | null,
    public estimatedDeliveryDate: Date | null,
    public deliveredAt: Date | null,
    public carrierResponse: Record<string, any> | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): Shipment {
    return new Shipment(
      data.id,
      data.orderId,
      data.carrierId,
      data.methodId,
      data.trackingNumber,
      data.status as ShipmentStatus,
      Number(data.weight),
      Number(data.cost),
      data.originAddress as Address,
      data.destinationAddress as Address,
      data.shippedAt,
      data.estimatedDeliveryDate,
      data.deliveredAt,
      data.carrierResponse as Record<string, any> | null,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Check if shipment can be updated to the given status
   */
  canTransitionTo(newStatus: ShipmentStatus): boolean {
    const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
      [ShipmentStatus.PENDING]: [
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.EXCEPTION,
      ],
      [ShipmentStatus.IN_TRANSIT]: [
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.DELIVERED,
        ShipmentStatus.EXCEPTION,
      ],
      [ShipmentStatus.OUT_FOR_DELIVERY]: [
        ShipmentStatus.DELIVERED,
        ShipmentStatus.EXCEPTION,
      ],
      [ShipmentStatus.DELIVERED]: [], // Final state
      [ShipmentStatus.EXCEPTION]: [
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.OUT_FOR_DELIVERY,
      ],
    };

    return validTransitions[this.status]?.includes(newStatus) ?? false;
  }

  /**
   * Update shipment status
   */
  updateStatus(newStatus: ShipmentStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }
    this.status = newStatus;
    
    if (newStatus === ShipmentStatus.IN_TRANSIT && !this.shippedAt) {
      this.shippedAt = new Date();
    }
    if (newStatus === ShipmentStatus.DELIVERED && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
  }
}

