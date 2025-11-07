/**
 * Prisma Notification Preference Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { INotificationPreferenceRepository } from '../../ports/interfaces/INotificationPreferenceRepository';
import { NotificationPreference, CreateNotificationPreferenceData, UpdateNotificationPreferenceData } from '../../core/entities/NotificationPreference';

export class PrismaNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(data: CreateNotificationPreferenceData): Promise<NotificationPreference> {
    const preference = await this.prisma.notificationPreference.upsert({
      where: {
        userId_channel_category: {
          userId: data.userId,
          channel: data.channel,
          category: data.category,
        },
      },
      update: {
        enabled: data.enabled ?? true,
        frequency: data.frequency,
      },
      create: {
        userId: data.userId,
        channel: data.channel,
        category: data.category,
        enabled: data.enabled ?? true,
        frequency: data.frequency,
      },
    });

    return this.mapToEntity(preference);
  }

  async findById(id: string): Promise<NotificationPreference | null> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: { id },
    });

    return preference ? this.mapToEntity(preference) : null;
  }

  async findByUserChannelCategory(
    userId: string,
    channel: string,
    category: string
  ): Promise<NotificationPreference | null> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_channel_category: {
          userId,
          channel,
          category,
        },
      },
    });

    return preference ? this.mapToEntity(preference) : null;
  }

  async findByUserId(userId: string): Promise<NotificationPreference[]> {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: [{ channel: 'asc' }, { category: 'asc' }],
    });

    return preferences.map((p) => this.mapToEntity(p));
  }

  async findByUserIdAndChannel(userId: string, channel: string): Promise<NotificationPreference[]> {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: {
        userId,
        channel,
      },
      orderBy: { category: 'asc' },
    });

    return preferences.map((p) => this.mapToEntity(p));
  }

  async update(id: string, data: UpdateNotificationPreferenceData): Promise<NotificationPreference> {
    const preference = await this.prisma.notificationPreference.update({
      where: { id },
      data: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
      },
    });

    return this.mapToEntity(preference);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificationPreference.delete({
      where: { id },
    });
  }

  async isEnabled(userId: string, channel: string, category: string): Promise<boolean> {
    const preference = await this.findByUserChannelCategory(userId, channel, category);
    return preference?.enabled ?? true; // Default to enabled if not set
  }

  private mapToEntity(preference: any): NotificationPreference {
    return {
      id: preference.id,
      userId: preference.userId,
      channel: preference.channel,
      category: preference.category,
      enabled: preference.enabled,
      frequency: preference.frequency,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  }
}

