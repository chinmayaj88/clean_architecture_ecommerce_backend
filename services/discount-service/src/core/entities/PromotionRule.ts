export class PromotionRule {
  constructor(
    public id: string,
    public promotionId: string,
    public ruleType: string,
    public conditions: Record<string, any>,
    public actions: Record<string, any>,
    public priority: number,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): PromotionRule {
    return new PromotionRule(
      data.id,
      data.promotionId,
      data.ruleType,
      data.conditions as Record<string, any>,
      data.actions as Record<string, any>,
      data.priority,
      data.createdAt,
      data.updatedAt
    );
  }
}

