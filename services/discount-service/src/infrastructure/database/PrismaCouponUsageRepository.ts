import { PrismaClient } from '@prisma/client';
import { ICouponUsageRepository, CreateCouponUsageData } from '../../ports/interfaces/ICouponUsageRepository';
import { CouponUsage } from '../../core/entities/CouponUsage';

export class PrismaCouponUsageRepository implements ICouponUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateCouponUsageData): Promise<CouponUsage> {
    const created = await (this.prisma as any).couponUsage.create({
      data: {
        couponId: data.couponId,
        userId: data.userId || null,
        orderId: data.orderId || null,
        discountAmount: data.discountAmount,
      },
    });

    return CouponUsage.fromPrisma(created);
  }

  async findById(id: string): Promise<CouponUsage | null> {
    const usage = await (this.prisma as any).couponUsage.findUnique({
      where: { id },
    });

    if (!usage) {
      return null;
    }

    return CouponUsage.fromPrisma(usage);
  }

  async findByCouponId(couponId: string, options?: { limit?: number; offset?: number }): Promise<CouponUsage[]> {
    const usages = await (this.prisma as any).couponUsage.findMany({
      where: { couponId },
      orderBy: { usedAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return usages.map((u: any) => CouponUsage.fromPrisma(u));
  }

  async findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<CouponUsage[]> {
    const usages = await (this.prisma as any).couponUsage.findMany({
      where: { userId },
      orderBy: { usedAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return usages.map((u: any) => CouponUsage.fromPrisma(u));
  }

  async findByOrderId(orderId: string): Promise<CouponUsage | null> {
    const usage = await (this.prisma as any).couponUsage.findFirst({
      where: { orderId },
    });

    if (!usage) {
      return null;
    }

    return CouponUsage.fromPrisma(usage);
  }

  async countByCouponAndUser(couponId: string, userId: string): Promise<number> {
    return await (this.prisma as any).couponUsage.count({
      where: {
        couponId,
        userId,
      },
    });
  }

  async countByCoupon(couponId: string): Promise<number> {
    return await (this.prisma as any).couponUsage.count({
      where: { couponId },
    });
  }
}

