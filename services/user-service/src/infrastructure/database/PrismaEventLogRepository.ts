/**
 * Event Log Repository - For idempotency
 * Tracks consumed events to prevent duplicate processing
 */

import { PrismaClient } from '@prisma/client';

export class PrismaEventLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async logEvent(eventId: string, eventType: string, source: string, payload: Record<string, unknown>): Promise<void> {
    await this.prisma.eventLog.upsert({
      where: { eventId },
      create: {
        eventId,
        eventType,
        source,
        payload: JSON.stringify(payload),
        processed: false,
      },
      update: {},
    });
  }

  async markAsProcessed(eventId: string): Promise<void> {
    await this.prisma.eventLog.update({
      where: { eventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  async markAsFailed(eventId: string, error: string): Promise<void> {
    await this.prisma.eventLog.update({
      where: { eventId },
      data: {
        processed: false,
        error,
      },
    });
  }

  async isProcessed(eventId: string): Promise<boolean> {
    const eventLog = await this.prisma.eventLog.findUnique({
      where: { eventId },
    });

    return eventLog?.processed ?? false;
  }
}

