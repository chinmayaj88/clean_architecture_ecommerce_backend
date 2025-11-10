export enum NotificationLogStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

export class NotificationLog {
  constructor(
    public id: string,
    public notificationId: string,
    public status: NotificationLogStatus,
    public provider: string,
    public providerMessageId: string | null,
    public providerResponse: Record<string, any> | null,
    public error: string | null,
    public createdAt: Date
  ) {}

  static fromPrisma(data: any): NotificationLog {
    return new NotificationLog(
      data.id,
      data.notificationId,
      data.status as NotificationLogStatus,
      data.provider,
      data.providerMessageId,
      data.providerResponse as Record<string, any> | null,
      data.error,
      data.createdAt
    );
  }

  isSuccessful(): boolean {
    return this.status === NotificationLogStatus.SENT || this.status === NotificationLogStatus.DELIVERED;
  }

  isFailed(): boolean {
    return this.status === NotificationLogStatus.FAILED || this.status === NotificationLogStatus.BOUNCED;
  }
}



