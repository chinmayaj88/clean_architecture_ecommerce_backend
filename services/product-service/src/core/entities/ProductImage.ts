export class ProductImage {
  constructor(
    public id: string,
    public productId: string,
    public url: string,
    public altText: string | null,
    public sortOrder: number,
    public isPrimary: boolean,
    public createdAt: Date
  ) {}
}

