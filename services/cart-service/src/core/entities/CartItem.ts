export class CartItem {
  constructor(
    public id: string,
    public cartId: string,
    public productId: string,
    public variantId: string | null,
    public productName: string,
    public productSku: string,
    public productImageUrl: string | null,
    public unitPrice: number,
    public quantity: number,
    public totalPrice: number,
    public metadata: Record<string, any> | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): CartItem {
    return new CartItem(
      data.id,
      data.cartId,
      data.productId,
      data.variantId,
      data.productName,
      data.productSku,
      data.productImageUrl,
      Number(data.unitPrice),
      data.quantity,
      Number(data.totalPrice),
      data.metadata as Record<string, any> | null,
      data.createdAt,
      data.updatedAt
    );
  }

  updateQuantity(quantity: number): void {
    this.quantity = quantity;
    this.totalPrice = this.unitPrice * quantity;
  }

  updatePrice(unitPrice: number): void {
    this.unitPrice = unitPrice;
    this.totalPrice = unitPrice * this.quantity;
  }
}

