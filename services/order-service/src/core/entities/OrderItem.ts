export class OrderItem {
  constructor(
    public id: string,
    public orderId: string,
    public productId: string,
    public variantId: string | null,
    public productName: string,
    public productSku: string,
    public productImageUrl: string | null,
    public unitPrice: number,
    public quantity: number,
    public totalPrice: number,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): OrderItem {
    return new OrderItem(
      data.id,
      data.orderId,
      data.productId,
      data.variantId,
      data.productName,
      data.productSku,
      data.productImageUrl,
      Number(data.unitPrice),
      data.quantity,
      Number(data.totalPrice),
      data.createdAt
    );
  }

  calculateTotal(): number {
    return this.unitPrice * this.quantity;
  }
}

