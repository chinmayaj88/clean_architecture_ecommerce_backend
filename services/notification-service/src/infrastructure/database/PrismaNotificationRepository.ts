import { PrismaClient } from '@prisma/client';
import { INotificationRepository, CreateNotificationData, NotificationFilterOptions } from '../../ports/interfaces/INotificationRepository';
import { Notification, NotificationStatus } from '../../core/entities/Notification';

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const created = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        templateId: data.templateId || null,
        subject: data.subject || null,
        body: data.body,
        status: data.status || NotificationStatus.PENDING,
        metadata: data.metadata || undefined,
        scheduledAt: data.scheduledAt || null,
      },
    });

    return Notification.fromPrisma(created);
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return null;
    }

    return Notification.fromPrisma(notification);
  }

  async findByUserId(userId: string, options?: NotificationFilterOptions): Promise<Notification[]> {
    const where: any = {
      userId,
    };

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return notifications.map((n) => Notification.fromPrisma(n));
  }

  async findPending(options?: { limit?: number; scheduledBefore?: Date }): Promise<Notification[]> {
    const where: any = {
      status: NotificationStatus.PENDING,
    };

    const now = options?.scheduledBefore || new Date();
    where.OR = [
      { scheduledAt: null },
      { scheduledAt: { lte: now } },
    ];

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: options?.limit || 100,
    });

    return notifications.map((n) => Notification.fromPrisma(n));
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    sentAt?: Date | null,
    deliveredAt?: Date | null
  ): Promise<Notification> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (sentAt !== undefined) {
      updateData.sentAt = sentAt;
    }

    if (deliveredAt !== undefined) {
      updateData.deliveredAt = deliveredAt;
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: updateData,
    });

    return Notification.fromPrisma(updated);
  }

  async update(id: string, data: Partial<CreateNotificationData>): Promise<Notification> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.userId !== undefined) {
      updateData.userId = data.userId;
    }
    if (data.type !== undefined) {
      updateData.type = data.type;
    }
    if (data.templateId !== undefined) {
      updateData.templateId = data.templateId;
    }
    if (data.subject !== undefined) {
      updateData.subject = data.subject;
    }
    if (data.body !== undefined) {
      updateData.body = data.body;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt;
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: updateData,
    });

    return Notification.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async count(options?: NotificationFilterOptions): Promise<number> {
    const where: any = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    return this.prisma.notification.count({ where });
  }
}

