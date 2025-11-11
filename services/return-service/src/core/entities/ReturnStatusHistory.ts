export class ReturnStatusHistory {
  constructor(
    public id: string,
    public returnRequestId: string,
    public status: string,
    public previousStatus: string | null,
    public changedBy: string,
    public notes: string | null,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): ReturnStatusHistory {
    return new ReturnStatusHistory(
      data.id,
      data.returnRequestId,
      data.status,
      data.previousStatus,
      data.changedBy,
      data.notes,
      data.createdAt
    );
  }
}

