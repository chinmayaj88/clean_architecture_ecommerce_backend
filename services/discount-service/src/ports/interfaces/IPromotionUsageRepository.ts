import { PromotionUsage } from '../../core/entities/PromotionUsage';

export interface CreatePromotionUsageData {
  promotionId: string;
  userId?: string | null;
  orderId?: string | null;
  discountAmount: number;
}

export interface IPromotionUsageRepository {
  create(data: CreatePromotionUsageData): Promise<PromotionUsage>;
  findById(id: string): Promise<PromotionUsage | null>;
  findByPromotionId(promotionId: string, options?: { limit?: number; offset?: number }): Promise<PromotionUsage[]>;
  findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<PromotionUsage[]>;
  findByOrderId(orderId: string): Promise<PromotionUsage[]>;
  countByPromotion(promotionId: string): Promise<number>;
}

