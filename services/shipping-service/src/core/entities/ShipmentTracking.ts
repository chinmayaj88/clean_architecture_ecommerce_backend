export class ShipmentTracking {
  constructor(
    public id: string,
    public shipmentId: string,
    public status: string,
    public location: string | null,
    public description: string | null,
    public timestamp: Date,
    public carrierData: Record<string, any> | null,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): ShipmentTracking {
    return new ShipmentTracking(
      data.id,
      data.shipmentId,
      data.status,
      data.location,
      data.description,
      data.timestamp,
      data.carrierData as Record<string, any> | null,
      data.createdAt
    );
  }
}

