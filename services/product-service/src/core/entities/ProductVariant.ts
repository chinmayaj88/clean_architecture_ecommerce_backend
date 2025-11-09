export class ProductVariant {
  constructor(
    public id: string,
    public productId: string,
    public sku: string,
    public name: string | null,
    public price: number | null,
    public compareAtPrice: number | null,
    public stockQuantity: number,
    public stockStatus: string,
    public attributes: Record<string, any> | null,
    public imageUrl: string | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}
}

