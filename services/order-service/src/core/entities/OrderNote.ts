export class OrderNote {
  constructor(
    public id: string,
    public orderId: string,
    public note: string,
    public createdBy: string,
    public isInternal: boolean,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): OrderNote {
    return new OrderNote(
      data.id,
      data.orderId,
      data.note,
      data.createdBy,
      data.isInternal,
      data.createdAt
    );
  }
}

