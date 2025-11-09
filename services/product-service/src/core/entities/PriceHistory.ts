export class PriceHistory {
  constructor(
    public id: string,
    public productId: string,
    public price: number,
    public compareAtPrice: number | null,
    public changedBy: string | null,
    public reason: string | null,
    public createdAt: Date
  ) {}
}

