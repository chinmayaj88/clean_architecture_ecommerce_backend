import { PrismaClient } from '@prisma/client';
import { IPromotionRuleRepository, CreatePromotionRuleData, UpdatePromotionRuleData } from '../../ports/interfaces/IPromotionRuleRepository';
import { PromotionRule } from '../../core/entities/PromotionRule';

export class PrismaPromotionRuleRepository implements IPromotionRuleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePromotionRuleData): Promise<PromotionRule> {
    const created = await (this.prisma as any).promotionRule.create({
      data: {
        promotionId: data.promotionId,
        ruleType: data.ruleType,
        conditions: data.conditions,
        actions: data.actions,
        priority: data.priority || 0,
      },
    });

    return PromotionRule.fromPrisma(created);
  }

  async findById(id: string): Promise<PromotionRule | null> {
    const rule = await (this.prisma as any).promotionRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return null;
    }

    return PromotionRule.fromPrisma(rule);
  }

  async findByPromotionId(promotionId: string): Promise<PromotionRule[]> {
    const rules = await (this.prisma as any).promotionRule.findMany({
      where: { promotionId },
      orderBy: { priority: 'desc' },
    });

    return rules.map((r: any) => PromotionRule.fromPrisma(r));
  }

  async update(id: string, data: UpdatePromotionRuleData): Promise<PromotionRule> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.ruleType !== undefined) updateData.ruleType = data.ruleType;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.actions !== undefined) updateData.actions = data.actions;
    if (data.priority !== undefined) updateData.priority = data.priority;

    const updated = await (this.prisma as any).promotionRule.update({
      where: { id },
      data: updateData,
    });

    return PromotionRule.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).promotionRule.delete({
      where: { id },
    });
  }

  async deleteByPromotionId(promotionId: string): Promise<void> {
    await (this.prisma as any).promotionRule.deleteMany({
      where: { promotionId },
    });
  }
}

