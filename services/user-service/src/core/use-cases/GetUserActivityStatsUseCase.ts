/**
 * Get User Activity Stats Use Case
 */

import { IUserActivityRepository } from '../../ports/interfaces/IUserActivityRepository';

export class GetUserActivityStatsUseCase {
  constructor(private readonly activityRepository: IUserActivityRepository) {}

  async execute(userId: string, days = 30): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    mostActiveDay: string;
  }> {
    return this.activityRepository.getActivityStats(userId, days);
  }
}

