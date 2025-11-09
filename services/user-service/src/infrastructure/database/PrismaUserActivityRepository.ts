/**
 * Prisma User Activity Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IUserActivityRepository } from '../../ports/interfaces/IUserActivityRepository';
import { UserActivity, CreateUserActivityData } from '../../core/entities/UserActivity';

export class PrismaUserActivityRepository implements IUserActivityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserActivityData): Promise<UserActivity> {
    const activity = await this.prisma.userActivity.create({
      data: {
        userId: data.userId,
        activityType: data.activityType,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata || undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    return this.mapToEntity(activity);
  }

  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      activityType?: string;
      entityType?: string;
    }
  ): Promise<UserActivity[]> {
    const where: any = { userId };

    if (options?.activityType) {
      where.activityType = options.activityType;
    }

    if (options?.entityType) {
      where.entityType = options.entityType;
    }

    const activities = await this.prisma.userActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return activities.map((a: any) => this.mapToEntity(a));
  }

  async countByUserId(
    userId: string,
    filters?: {
      activityType?: string;
      entityType?: string;
    }
  ): Promise<number> {
    const where: any = { userId };

    if (filters?.activityType) {
      where.activityType = filters.activityType;
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    return this.prisma.userActivity.count({ where });
  }

  async getActivityStats(userId: string, days = 30): Promise<{
    totalActivities: number;
    activitiesByType: Record<string, number>;
    mostActiveDay: string;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const activities = await this.prisma.userActivity.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      select: {
        activityType: true,
        createdAt: true,
      },
    });

    const totalActivities = activities.length;
    const activitiesByType: Record<string, number> = {};
    const activitiesByDay: Record<string, number> = {};

    activities.forEach((activity: any) => {
      // Count by type
      activitiesByType[activity.activityType] = (activitiesByType[activity.activityType] || 0) + 1;

      // Count by day
      const day = activity.createdAt.toISOString().split('T')[0];
      activitiesByDay[day] = (activitiesByDay[day] || 0) + 1;
    });

    // Find most active day
    let mostActiveDay = '';
    let maxCount = 0;
    for (const [day, count] of Object.entries(activitiesByDay)) {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = day;
      }
    }

    return {
      totalActivities,
      activitiesByType,
      mostActiveDay,
    };
  }

  private mapToEntity(activity: any): UserActivity {
    return {
      id: activity.id,
      userId: activity.userId,
      activityType: activity.activityType,
      entityType: activity.entityType,
      entityId: activity.entityId,
      metadata: activity.metadata || undefined,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      createdAt: activity.createdAt,
    };
  }
}

