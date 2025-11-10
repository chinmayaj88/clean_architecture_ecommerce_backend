import { NotificationPreference } from '../../core/entities/NotificationPreference';

export interface CreateNotificationPreferenceData {
  userId: string;
  notificationType: string;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
}

export interface UpdateNotificationPreferenceData {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
}

export interface INotificationPreferenceRepository {
  create(data: CreateNotificationPreferenceData): Promise<NotificationPreference>;
  findById(id: string): Promise<NotificationPreference | null>;
  findByUserId(userId: string): Promise<NotificationPreference[]>;
  findByUserAndType(userId: string, notificationType: string): Promise<NotificationPreference | null>;
  update(id: string, data: UpdateNotificationPreferenceData): Promise<NotificationPreference>;
  delete(id: string): Promise<void>;
  getDefaultPreference(notificationType: string): NotificationPreference;
}



