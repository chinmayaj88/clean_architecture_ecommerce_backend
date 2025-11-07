export class Product {
  constructor(
    public id: string,
    public sku: string,
    public name: string,
    public slug: string,
    public description: string | null,
    public shortDescription: string | null,
    public price: number,
    public compareAtPrice: number | null,
    public costPrice: number | null,
    public status: 'draft' | 'active' | 'archived',
    public isVisible: boolean,
    public stockQuantity: number,
    public stockStatus: 'in_stock' | 'out_of_stock' | 'backorder',
    public weight: number | null,
    public length: number | null,
    public width: number | null,
    public height: number | null,
    public metaTitle: string | null,
    public metaDescription: string | null,
    public attributes: Record<string, any> | null,
    public badges: string[],
    public viewCount: number,
    public purchaseCount: number,
    public searchCount: number,
    public createdAt: Date,
    public updatedAt: Date,
    public publishedAt: Date | null
  ) {}
}

