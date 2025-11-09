export class ProductTag {
  constructor(
    public id: string,
    public productId: string,
    public tag: string,
    public createdAt: Date
  ) {}
}

