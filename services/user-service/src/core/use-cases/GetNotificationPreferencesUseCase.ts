/**
 * Get Notification Preferences Use Case
 */

import { INotificationPreferenceRepository } from '../../ports/interfaces/INotificationPreferenceRepository';
import { NotificationPreference } from '../../core/entities/NotificationPreference';

export class GetNotificationPreferencesUseCase {
  constructor(private readonly notificationPreferenceRepository: INotificationPreferenceRepository) {}

  async execute(userId: string, channel?: string): Promise<NotificationPreference[]> {
    if (channel) {
      return this.notificationPreferenceRepository.findByUserIdAndChannel(userId, channel);
    }
    return this.notificationPreferenceRepository.findByUserId(userId);
  }
}

