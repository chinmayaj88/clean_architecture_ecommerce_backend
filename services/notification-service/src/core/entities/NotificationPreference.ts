export class NotificationPreference {
  constructor(
    public id: string,
    public userId: string,
    public notificationType: string,
    public emailEnabled: boolean,
    public smsEnabled: boolean,
    public pushEnabled: boolean,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): NotificationPreference {
    return new NotificationPreference(
      data.id,
      data.userId,
      data.notificationType,
      data.emailEnabled,
      data.smsEnabled,
      data.pushEnabled,
      data.createdAt,
      data.updatedAt
    );
  }

  isEmailEnabled(): boolean {
    return this.emailEnabled;
  }

  isSmsEnabled(): boolean {
    return this.smsEnabled;
  }

  isPushEnabled(): boolean {
    return this.pushEnabled;
  }

  isChannelEnabled(channel: 'email' | 'sms' | 'push'): boolean {
    switch (channel) {
      case 'email':
        return this.emailEnabled;
      case 'sms':
        return this.smsEnabled;
      case 'push':
        return this.pushEnabled;
      default:
        return false;
    }
  }

  // Security notifications cannot be disabled
  canBeDisabled(): boolean {
    return this.notificationType !== 'security';
  }
}




