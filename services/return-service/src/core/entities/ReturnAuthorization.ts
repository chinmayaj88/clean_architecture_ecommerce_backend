export interface ReturnAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  name?: string;
  phone?: string;
}

export class ReturnAuthorization {
  constructor(
    public id: string,
    public returnRequestId: string,
    public rmaNumber: string,
    public returnAddress: ReturnAddress,
    public returnInstructions: string | null,
    public trackingNumber: string | null,
    public expiresAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): ReturnAuthorization {
    return new ReturnAuthorization(
      data.id,
      data.returnRequestId,
      data.rmaNumber,
      data.returnAddress as ReturnAddress,
      data.returnInstructions,
      data.trackingNumber,
      data.expiresAt,
      data.createdAt,
      data.updatedAt
    );
  }
}

