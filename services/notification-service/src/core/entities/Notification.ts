export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

export class Notification {
  constructor(
    public id: string,
    public userId: string,
    public type: NotificationType,
    public templateId: string | null,
    public subject: string | null,
    public body: string,
    public status: NotificationStatus,
    public metadata: Record<string, any> | null,
    public scheduledAt: Date | null,
    public sentAt: Date | null,
    public deliveredAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): Notification {
    return new Notification(
      data.id,
      data.userId,
      data.type as NotificationType,
      data.templateId,
      data.subject,
      data.body,
      data.status as NotificationStatus,
      data.metadata as Record<string, any> | null,
      data.scheduledAt,
      data.sentAt,
      data.deliveredAt,
      data.createdAt,
      data.updatedAt
    );
  }

  isPending(): boolean {
    return this.status === NotificationStatus.PENDING;
  }

  isSent(): boolean {
    return this.status === NotificationStatus.SENT;
  }

  isDelivered(): boolean {
    return this.status === NotificationStatus.DELIVERED;
  }

  isFailed(): boolean {
    return this.status === NotificationStatus.FAILED || this.status === NotificationStatus.BOUNCED;
  }

  canBeRetried(): boolean {
    return this.status === NotificationStatus.FAILED;
  }

  isScheduled(): boolean {
    return this.scheduledAt !== null && this.scheduledAt > new Date();
  }

  shouldSendNow(): boolean {
    if (this.status !== NotificationStatus.PENDING) {
      return false;
    }

    if (this.scheduledAt === null) {
      return true;
    }

    return this.scheduledAt <= new Date();
  }
}




