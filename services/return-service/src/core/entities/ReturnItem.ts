export enum ItemCondition {
  NEW = 'new',
  USED = 'used',
  DAMAGED = 'damaged',
  DEFECTIVE = 'defective',
}

export class ReturnItem {
  constructor(
    public id: string,
    public returnRequestId: string,
    public orderItemId: string,
    public productId: string,
    public variantId: string | null,
    public productName: string,
    public productSku: string,
    public quantity: number,
    public unitPrice: number,
    public refundAmount: number,
    public returnReason: string | null,
    public condition: ItemCondition,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): ReturnItem {
    return new ReturnItem(
      data.id,
      data.returnRequestId,
      data.orderItemId,
      data.productId,
      data.variantId,
      data.productName,
      data.productSku,
      data.quantity,
      Number(data.unitPrice),
      Number(data.refundAmount),
      data.returnReason,
      data.condition as ItemCondition,
      data.createdAt,
      data.updatedAt
    );
  }
}

