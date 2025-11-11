import { IPromotionRepository } from '../../ports/interfaces/IPromotionRepository';
import { IPromotionUsageRepository } from '../../ports/interfaces/IPromotionUsageRepository';
import { EvaluatePromotionUseCase, CartItem } from './EvaluatePromotionUseCase';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface ApplyPromotionInput {
  promotionId: string;
  userId?: string | null;
  orderId?: string | null;
  cartItems: CartItem[];
  cartTotal: number;
}

export interface ApplyPromotionResult {
  success: boolean;
  promotionId: string | null;
  discount: number;
  error?: string;
}

export class ApplyPromotionUseCase {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly _promotionRepository: IPromotionRepository,
    private readonly promotionUsageRepository: IPromotionUsageRepository,
    private readonly evaluatePromotionUseCase: EvaluatePromotionUseCase
  ) {}

  async execute(input: ApplyPromotionInput): Promise<ApplyPromotionResult> {
    try {
      // Evaluate promotion
      const evaluation = await this.evaluatePromotionUseCase.execute({
        promotionId: input.promotionId,
        cartItems: input.cartItems,
        cartTotal: input.cartTotal,
      });

      if (!evaluation.applicable || !evaluation.promotion) {
        return {
          success: false,
          promotionId: null,
          discount: 0,
          error: 'Promotion is not applicable',
        };
      }

      // Record promotion usage
      await this.promotionUsageRepository.create({
        promotionId: evaluation.promotion.id,
        userId: input.userId || null,
        orderId: input.orderId || null,
        discountAmount: evaluation.discount,
      });

      logger.info('Promotion applied successfully', {
        promotionId: evaluation.promotion.id,
        userId: input.userId,
        orderId: input.orderId,
        discount: evaluation.discount,
      });

      return {
        success: true,
        promotionId: evaluation.promotion.id,
        discount: evaluation.discount,
      };
    } catch (error) {
      logger.error('Error applying promotion', {
        promotionId: input.promotionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        promotionId: null,
        discount: 0,
        error: 'Failed to apply promotion',
      };
    }
  }
}

