import { NotificationLog, NotificationLogStatus } from '../../core/entities/NotificationLog';

export interface CreateNotificationLogData {
  notificationId: string;
  status: NotificationLogStatus;
  provider: string;
  providerMessageId?: string | null;
  providerResponse?: Record<string, any> | null;
  error?: string | null;
}

export interface INotificationLogRepository {
  create(data: CreateNotificationLogData): Promise<NotificationLog>;
  findById(id: string): Promise<NotificationLog | null>;
  findByNotificationId(notificationId: string): Promise<NotificationLog | null>;
  findByNotificationIds(notificationIds: string[]): Promise<NotificationLog[]>;
  update(id: string, data: Partial<CreateNotificationLogData>): Promise<NotificationLog>;
}



