import { PrismaClient } from '@prisma/client';
import { INotificationLogRepository, CreateNotificationLogData } from '../../ports/interfaces/INotificationLogRepository';
import { NotificationLog } from '../../core/entities/NotificationLog';

export class PrismaNotificationLogRepository implements INotificationLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateNotificationLogData): Promise<NotificationLog> {
    const created = await (this.prisma as any).notificationLog.create({
      data: {
        notificationId: data.notificationId,
        status: data.status,
        provider: data.provider,
        providerMessageId: data.providerMessageId || null,
        providerResponse: data.providerResponse || null,
        error: data.error || null,
      },
    });

    return NotificationLog.fromPrisma(created);
  }

  async findById(id: string): Promise<NotificationLog | null> {
    const log = await (this.prisma as any).notificationLog.findUnique({
      where: { id },
    });

    if (!log) {
      return null;
    }

    return NotificationLog.fromPrisma(log);
  }

  async findByNotificationId(notificationId: string): Promise<NotificationLog | null> {
    const log = await (this.prisma as any).notificationLog.findUnique({
      where: { notificationId },
    });

    if (!log) {
      return null;
    }

    return NotificationLog.fromPrisma(log);
  }

  async findByNotificationIds(notificationIds: string[]): Promise<NotificationLog[]> {
    const logs = await (this.prisma as any).notificationLog.findMany({
      where: {
        notificationId: {
          in: notificationIds,
        },
      },
    });

    return logs.map((l: any) => NotificationLog.fromPrisma(l));
  }

  async update(id: string, data: Partial<CreateNotificationLogData>): Promise<NotificationLog> {
    const updateData: any = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.provider !== undefined) {
      updateData.provider = data.provider;
    }
    if (data.providerMessageId !== undefined) {
      updateData.providerMessageId = data.providerMessageId;
    }
    if (data.providerResponse !== undefined) {
      updateData.providerResponse = data.providerResponse;
    }
    if (data.error !== undefined) {
      updateData.error = data.error;
    }

    const updated = await (this.prisma as any).notificationLog.update({
      where: { id },
      data: updateData,
    });

    return NotificationLog.fromPrisma(updated);
  }
}

