import { PrismaClient } from '@prisma/client';
import {
  INotificationPreferenceRepository,
  CreateNotificationPreferenceData,
  UpdateNotificationPreferenceData,
} from '../../ports/interfaces/INotificationPreferenceRepository';
import { NotificationPreference } from '../../core/entities/NotificationPreference';

export class PrismaNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateNotificationPreferenceData): Promise<NotificationPreference> {
    const created = await (this.prisma as any).notificationPreference.create({
      data: {
        userId: data.userId,
        notificationType: data.notificationType,
        emailEnabled: data.emailEnabled !== undefined ? data.emailEnabled : true,
        smsEnabled: data.smsEnabled !== undefined ? data.smsEnabled : false,
        pushEnabled: data.pushEnabled !== undefined ? data.pushEnabled : true,
      },
    });

    return NotificationPreference.fromPrisma(created);
  }

  async findById(id: string): Promise<NotificationPreference | null> {
    const preference = await (this.prisma as any).notificationPreference.findUnique({
      where: { id },
    });

    if (!preference) {
      return null;
    }

    return NotificationPreference.fromPrisma(preference);
  }

  async findByUserId(userId: string): Promise<NotificationPreference[]> {
    const preferences = await (this.prisma as any).notificationPreference.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return preferences.map((p: any) => NotificationPreference.fromPrisma(p));
  }

  async findByUserAndType(userId: string, notificationType: string): Promise<NotificationPreference | null> {
    const preference = await (this.prisma as any).notificationPreference.findUnique({
      where: {
        userId_notificationType: {
          userId,
          notificationType,
        },
      },
    });

    if (!preference) {
      return null;
    }

    return NotificationPreference.fromPrisma(preference);
  }

  async update(id: string, data: UpdateNotificationPreferenceData): Promise<NotificationPreference> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.emailEnabled !== undefined) {
      updateData.emailEnabled = data.emailEnabled;
    }
    if (data.smsEnabled !== undefined) {
      updateData.smsEnabled = data.smsEnabled;
    }
    if (data.pushEnabled !== undefined) {
      updateData.pushEnabled = data.pushEnabled;
    }

    const updated = await (this.prisma as any).notificationPreference.update({
      where: { id },
      data: updateData,
    });

    return NotificationPreference.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).notificationPreference.delete({
      where: { id },
    });
  }

  getDefaultPreference(notificationType: string): NotificationPreference {
    // Security notifications are always enabled
    const isSecurity = notificationType === 'security';
    const isMarketing = notificationType === 'marketing' || notificationType === 'newsletter';

    return new NotificationPreference(
      '',
      '',
      notificationType,
      isSecurity || !isMarketing, // Email enabled for security and non-marketing
      false, // SMS disabled by default
      isSecurity || !isMarketing, // Push enabled for security and non-marketing
      new Date(),
      new Date()
    );
  }
}

