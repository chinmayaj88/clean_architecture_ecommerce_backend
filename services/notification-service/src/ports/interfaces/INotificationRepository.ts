import { Notification, NotificationStatus, NotificationType } from '../../core/entities/Notification';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  templateId?: string | null;
  subject?: string | null;
  body: string;
  metadata?: Record<string, any> | null;
  scheduledAt?: Date | null;
  status?: NotificationStatus;
}

export interface NotificationFilterOptions {
  userId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, options?: NotificationFilterOptions): Promise<Notification[]>;
  findPending(options?: { limit?: number; scheduledBefore?: Date }): Promise<Notification[]>;
  updateStatus(id: string, status: NotificationStatus, sentAt?: Date | null, deliveredAt?: Date | null): Promise<Notification>;
  update(id: string, data: Partial<CreateNotificationData>): Promise<Notification>;
  delete(id: string): Promise<void>;
  count(options?: NotificationFilterOptions): Promise<number>;
}



