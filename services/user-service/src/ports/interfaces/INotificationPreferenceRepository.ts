/**
 * Notification Preference Repository Interface
 */

import { NotificationPreference, CreateNotificationPreferenceData, UpdateNotificationPreferenceData } from '../../core/entities/NotificationPreference';

export interface INotificationPreferenceRepository {
  /**
   * Create or update notification preference
   */
  upsert(data: CreateNotificationPreferenceData): Promise<NotificationPreference>;

  /**
   * Find preference by ID
   */
  findById(id: string): Promise<NotificationPreference | null>;

  /**
   * Find preference by user, channel, and category
   */
  findByUserChannelCategory(
    userId: string,
    channel: string,
    category: string
  ): Promise<NotificationPreference | null>;

  /**
   * Find all preferences for a user
   */
  findByUserId(userId: string): Promise<NotificationPreference[]>;

  /**
   * Find preferences by channel
   */
  findByUserIdAndChannel(userId: string, channel: string): Promise<NotificationPreference[]>;

  /**
   * Update preference
   */
  update(id: string, data: UpdateNotificationPreferenceData): Promise<NotificationPreference>;

  /**
   * Delete preference
   */
  delete(id: string): Promise<void>;

  /**
   * Check if notification is enabled for user, channel, and category
   */
  isEnabled(userId: string, channel: string, category: string): Promise<boolean>;
}

