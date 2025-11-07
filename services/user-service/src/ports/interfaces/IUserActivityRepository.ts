/**
 * User Activity Repository Interface
 */

import { UserActivity, CreateUserActivityData } from '../../core/entities/UserActivity';

export interface IUserActivityRepository {
  /**
   * Create activity entry
   */
  create(data: CreateUserActivityData): Promise<UserActivity>;

  /**
   * Get activities for a user
   */
  findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      activityType?: string;
      entityType?: string;
    }
  ): Promise<UserActivity[]>;

  /**
   * Count activities for a user
   */
  countByUserId(
    userId: string,
    filters?: {
      activityType?: string;
      entityType?: string;
    }
  ): Promise<number>;

  /**
   * Get activity statistics
   */
  getActivityStats(userId: string, days?: number): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    mostActiveDay: string;
  }>;
}

