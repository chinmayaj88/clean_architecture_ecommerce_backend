/**
 * Update Notification Preference Use Case
 */

import { INotificationPreferenceRepository } from '../../ports/interfaces/INotificationPreferenceRepository';
import { NotificationPreference, CreateNotificationPreferenceData, UpdateNotificationPreferenceData } from '../../core/entities/NotificationPreference';

export class UpdateNotificationPreferenceUseCase {
  constructor(private readonly notificationPreferenceRepository: INotificationPreferenceRepository) {}

  async execute(
    userId: string,
    data: CreateNotificationPreferenceData
  ): Promise<NotificationPreference> {
    return this.notificationPreferenceRepository.upsert({
      ...data,
      userId,
    });
  }

  async updatePreference(
    preferenceId: string,
    userId: string,
    data: UpdateNotificationPreferenceData
  ): Promise<NotificationPreference> {
    // Verify ownership
    const preference = await this.notificationPreferenceRepository.findById(preferenceId);
    if (!preference) {
      throw new Error('Notification preference not found');
    }

    if (preference.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.notificationPreferenceRepository.update(preferenceId, data);
  }
}

