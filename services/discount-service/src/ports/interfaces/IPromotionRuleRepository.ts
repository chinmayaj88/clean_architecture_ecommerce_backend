import { PromotionRule } from '../../core/entities/PromotionRule';

export interface CreatePromotionRuleData {
  promotionId: string;
  ruleType: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  priority?: number;
}

export interface UpdatePromotionRuleData {
  ruleType?: string;
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  priority?: number;
}

export interface IPromotionRuleRepository {
  create(data: CreatePromotionRuleData): Promise<PromotionRule>;
  findById(id: string): Promise<PromotionRule | null>;
  findByPromotionId(promotionId: string): Promise<PromotionRule[]>;
  update(id: string, data: UpdatePromotionRuleData): Promise<PromotionRule>;
  delete(id: string): Promise<void>;
  deleteByPromotionId(promotionId: string): Promise<void>;
}

