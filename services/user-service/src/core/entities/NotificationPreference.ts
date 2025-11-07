/**
 * Notification Preference Entity
 * Granular notification settings per channel and category
 */

export interface NotificationPreference {
  id: string;
  userId: string;
  channel: 'email' | 'sms' | 'push';
  category: 'orders' | 'promotions' | 'reviews' | 'security' | 'wishlist' | 'stock_alerts' | 'newsletter';
  enabled: boolean;
  frequency?: 'realtime' | 'daily' | 'weekly' | 'never' | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationPreferenceData {
  userId: string;
  channel: 'email' | 'sms' | 'push';
  category: 'orders' | 'promotions' | 'reviews' | 'security' | 'wishlist' | 'stock_alerts' | 'newsletter';
  enabled?: boolean;
  frequency?: 'realtime' | 'daily' | 'weekly' | 'never';
}

export interface UpdateNotificationPreferenceData {
  enabled?: boolean;
  frequency?: 'realtime' | 'daily' | 'weekly' | 'never';
}

