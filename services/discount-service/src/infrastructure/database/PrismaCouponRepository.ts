import { PrismaClient } from '@prisma/client';
import { ICouponRepository, CreateCouponData, UpdateCouponData, CouponFilterOptions } from '../../ports/interfaces/ICouponRepository';
import { Coupon } from '../../core/entities/Coupon';

export class PrismaCouponRepository implements ICouponRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateCouponData): Promise<Coupon> {
    const created = await (this.prisma as any).coupon.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        type: data.type,
        discountValue: data.discountValue,
        minimumAmount: data.minimumAmount || 0,
        maximumDiscount: data.maximumDiscount || null,
        currency: data.currency || 'USD',
        usageLimit: data.usageLimit || null,
        usageLimitPerUser: data.usageLimitPerUser || null,
        startsAt: data.startsAt || null,
        endsAt: data.endsAt || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        applicableProducts: data.applicableProducts || null,
        applicableCategories: data.applicableCategories || null,
        excludedProducts: data.excludedProducts || null,
        metadata: data.metadata || null,
      },
    });

    return Coupon.fromPrisma(created);
  }

  async findById(id: string): Promise<Coupon | null> {
    const coupon = await (this.prisma as any).coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return null;
    }

    return Coupon.fromPrisma(coupon);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const coupon = await (this.prisma as any).coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return null;
    }

    return Coupon.fromPrisma(coupon);
  }

  async findAll(options?: CouponFilterOptions): Promise<Coupon[]> {
    const where: any = {};

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.code) {
      where.code = { contains: options.code, mode: 'insensitive' };
    }

    const coupons = await (this.prisma as any).coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return coupons.map((c: any) => Coupon.fromPrisma(c));
  }

  async update(id: string, data: UpdateCouponData): Promise<Coupon> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.minimumAmount !== undefined) updateData.minimumAmount = data.minimumAmount;
    if (data.maximumDiscount !== undefined) updateData.maximumDiscount = data.maximumDiscount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.usageLimitPerUser !== undefined) updateData.usageLimitPerUser = data.usageLimitPerUser;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.applicableProducts !== undefined) updateData.applicableProducts = data.applicableProducts;
    if (data.applicableCategories !== undefined) updateData.applicableCategories = data.applicableCategories;
    if (data.excludedProducts !== undefined) updateData.excludedProducts = data.excludedProducts;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updated = await (this.prisma as any).coupon.update({
      where: { id },
      data: updateData,
    });

    return Coupon.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).coupon.delete({
      where: { id },
    });
  }

  async incrementUsageCount(id: string): Promise<Coupon> {
    const updated = await (this.prisma as any).coupon.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return Coupon.fromPrisma(updated);
  }

  async activate(id: string): Promise<Coupon> {
    const updated = await (this.prisma as any).coupon.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return Coupon.fromPrisma(updated);
  }

  async deactivate(id: string): Promise<Coupon> {
    const updated = await (this.prisma as any).coupon.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return Coupon.fromPrisma(updated);
  }
}

