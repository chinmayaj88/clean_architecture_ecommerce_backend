/**
 * Get User Activity Use Case
 */

import { IUserActivityRepository } from '../../ports/interfaces/IUserActivityRepository';
import { UserActivity } from '../../core/entities/UserActivity';

export class GetUserActivityUseCase {
  constructor(private readonly activityRepository: IUserActivityRepository) {}

  async execute(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      activityType?: string;
      entityType?: string;
    }
  ): Promise<{ activities: UserActivity[]; total: number }> {
    const [activities, total] = await Promise.all([
      this.activityRepository.findByUserId(userId, options),
      this.activityRepository.countByUserId(userId, {
        activityType: options?.activityType,
        entityType: options?.entityType,
      }),
    ]);

    return { activities, total };
  }
}

