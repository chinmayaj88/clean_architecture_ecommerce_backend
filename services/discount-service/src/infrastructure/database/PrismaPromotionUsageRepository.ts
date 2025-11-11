import { PrismaClient } from '@prisma/client';
import { IPromotionUsageRepository, CreatePromotionUsageData } from '../../ports/interfaces/IPromotionUsageRepository';
import { PromotionUsage } from '../../core/entities/PromotionUsage';

export class PrismaPromotionUsageRepository implements IPromotionUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePromotionUsageData): Promise<PromotionUsage> {
    const created = await (this.prisma as any).promotionUsage.create({
      data: {
        promotionId: data.promotionId,
        userId: data.userId || null,
        orderId: data.orderId || null,
        discountAmount: data.discountAmount,
      },
    });

    return PromotionUsage.fromPrisma(created);
  }

  async findById(id: string): Promise<PromotionUsage | null> {
    const usage = await (this.prisma as any).promotionUsage.findUnique({
      where: { id },
    });

    if (!usage) {
      return null;
    }

    return PromotionUsage.fromPrisma(usage);
  }

  async findByPromotionId(promotionId: string, options?: { limit?: number; offset?: number }): Promise<PromotionUsage[]> {
    const usages = await (this.prisma as any).promotionUsage.findMany({
      where: { promotionId },
      orderBy: { usedAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return usages.map((u: any) => PromotionUsage.fromPrisma(u));
  }

  async findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<PromotionUsage[]> {
    const usages = await (this.prisma as any).promotionUsage.findMany({
      where: { userId },
      orderBy: { usedAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return usages.map((u: any) => PromotionUsage.fromPrisma(u));
  }

  async findByOrderId(orderId: string): Promise<PromotionUsage[]> {
    const usages = await (this.prisma as any).promotionUsage.findMany({
      where: { orderId },
    });

    return usages.map((u: any) => PromotionUsage.fromPrisma(u));
  }

  async countByPromotion(promotionId: string): Promise<number> {
    return await (this.prisma as any).promotionUsage.count({
      where: { promotionId },
    });
  }
}

