export class OrderShippingAddress {
  constructor(
    public id: string,
    public orderId: string,
    public firstName: string,
    public lastName: string,
    public company: string | null,
    public addressLine1: string,
    public addressLine2: string | null,
    public city: string,
    public state: string | null,
    public postalCode: string,
    public country: string,
    public phone: string | null,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): OrderShippingAddress {
    return new OrderShippingAddress(
      data.id,
      data.orderId,
      data.firstName,
      data.lastName,
      data.company,
      data.addressLine1,
      data.addressLine2,
      data.city,
      data.state,
      data.postalCode,
      data.country,
      data.phone,
      data.createdAt
    );
  }

  getFullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.state,
      this.postalCode,
      this.country,
    ].filter(Boolean);
    return parts.join(', ');
  }
}

