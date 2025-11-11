export class ReturnTracking {
  constructor(
    public id: string,
    public authorizationId: string,
    public status: string,
    public location: string | null,
    public description: string | null,
    public timestamp: Date,
    public carrierData: Record<string, any> | null,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): ReturnTracking {
    return new ReturnTracking(
      data.id,
      data.authorizationId,
      data.status,
      data.location,
      data.description,
      data.timestamp,
      data.carrierData,
      data.createdAt
    );
  }
}

