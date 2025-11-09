export class ProductSearchHistory {
  constructor(
    public id: string,
    public productId: string | null,
    public userId: string | null,
    public query: string,
    public filters: Record<string, any> | null,
    public resultsCount: number | null,
    public createdAt: Date
  ) {}
}

