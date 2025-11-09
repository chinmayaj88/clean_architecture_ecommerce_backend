/**
 * Prisma Stock Alert Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IStockAlertRepository } from '../../ports/interfaces/IStockAlertRepository';
import { StockAlert, CreateStockAlertData } from '../../core/entities/StockAlert';

export class PrismaStockAlertRepository implements IStockAlertRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateStockAlertData): Promise<StockAlert> {
    // Set expiration to 90 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const alert = await this.prisma.stockAlert.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        email: data.email,
        variantId: data.variantId,
        notified: false,
        expiresAt,
      },
    });

    return this.mapToEntity(alert);
  }

  async findById(id: string): Promise<StockAlert | null> {
    const alert = await this.prisma.stockAlert.findUnique({
      where: { id },
    });

    return alert ? this.mapToEntity(alert) : null;
  }

  async findByProductId(productId: string, variantId?: string): Promise<StockAlert[]> {
    const alerts = await this.prisma.stockAlert.findMany({
      where: {
        productId,
        ...(variantId && { variantId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((a: any) => this.mapToEntity(a));
  }

  async findByUserId(userId: string): Promise<StockAlert[]> {
    const alerts = await this.prisma.stockAlert.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map((a: any) => this.mapToEntity(a));
  }

  async findUnnotifiedByProductId(productId: string, variantId?: string): Promise<StockAlert[]> {
    const alerts = await this.prisma.stockAlert.findMany({
      where: {
        productId,
        ...(variantId && { variantId }),
        notified: false,
        expiresAt: { gt: new Date() },
      },
    });

    return alerts.map((a: any) => this.mapToEntity(a));
  }

  async markAsNotified(id: string): Promise<void> {
    await this.prisma.stockAlert.update({
      where: { id },
      data: {
        notified: true,
        notifiedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.stockAlert.delete({
      where: { id },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.stockAlert.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }

  private mapToEntity(alert: any): StockAlert {
    return {
      id: alert.id,
      productId: alert.productId,
      userId: alert.userId,
      email: alert.email,
      variantId: alert.variantId,
      notified: alert.notified,
      notifiedAt: alert.notifiedAt,
      createdAt: alert.createdAt,
      expiresAt: alert.expiresAt,
    };
  }
}

