export class ProductInventory {
  constructor(
    public id: string,
    public productId: string,
    public variantId: string | null,
    public quantity: number,
    public reservedQuantity: number,
    public availableQuantity: number,
    public location: string | null,
    public lastRestockedAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}

