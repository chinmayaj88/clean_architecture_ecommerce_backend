import { PrismaClient } from '@prisma/client';
import { IPromotionRepository, CreatePromotionData, UpdatePromotionData, PromotionFilterOptions } from '../../ports/interfaces/IPromotionRepository';
import { Promotion, PromotionStatus } from '../../core/entities/Promotion';

export class PrismaPromotionRepository implements IPromotionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePromotionData): Promise<Promotion> {
    const created = await (this.prisma as any).promotion.create({
      data: {
        name: data.name,
        description: data.description || null,
        type: data.type,
        status: data.status || PromotionStatus.DRAFT,
        startsAt: data.startsAt || null,
        endsAt: data.endsAt || null,
        isActive: data.isActive !== undefined ? data.isActive : false,
        configuration: data.configuration,
        metadata: data.metadata || null,
      },
    });

    return Promotion.fromPrisma(created);
  }

  async findById(id: string): Promise<Promotion | null> {
    const promotion = await (this.prisma as any).promotion.findUnique({
      where: { id },
    });

    if (!promotion) {
      return null;
    }

    return Promotion.fromPrisma(promotion);
  }

  async findAll(options?: PromotionFilterOptions): Promise<Promotion[]> {
    const where: any = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.type) {
      where.type = options.type;
    }

    const promotions = await (this.prisma as any).promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return promotions.map((p: any) => Promotion.fromPrisma(p));
  }

  async findActive(): Promise<Promotion[]> {
    const now = new Date();
    const promotions = await (this.prisma as any).promotion.findMany({
      where: {
        isActive: true,
        status: PromotionStatus.ACTIVE,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return promotions.map((p: any) => Promotion.fromPrisma(p));
  }

  async update(id: string, data: UpdatePromotionData): Promise<Promotion> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.configuration !== undefined) updateData.configuration = data.configuration;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updated = await (this.prisma as any).promotion.update({
      where: { id },
      data: updateData,
    });

    return Promotion.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).promotion.delete({
      where: { id },
    });
  }

  async activate(id: string): Promise<Promotion> {
    const updated = await (this.prisma as any).promotion.update({
      where: { id },
      data: {
        isActive: true,
        status: PromotionStatus.ACTIVE,
        updatedAt: new Date(),
      },
    });

    return Promotion.fromPrisma(updated);
  }

  async deactivate(id: string): Promise<Promotion> {
    const updated = await (this.prisma as any).promotion.update({
      where: { id },
      data: {
        isActive: false,
        status: PromotionStatus.PAUSED,
        updatedAt: new Date(),
      },
    });

    return Promotion.fromPrisma(updated);
  }
}

