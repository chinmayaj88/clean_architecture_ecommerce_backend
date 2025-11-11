import { IPromotionRepository } from '../../ports/interfaces/IPromotionRepository';
import { IPromotionRuleRepository } from '../../ports/interfaces/IPromotionRuleRepository';
import { Promotion, PromotionType } from '../../core/entities/Promotion';
import { PromotionRule } from '../../core/entities/PromotionRule';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface CartItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  categoryIds?: string[];
}

export interface EvaluatePromotionInput {
  promotionId: string;
  cartItems: CartItem[];
  cartTotal: number;
}

export interface EvaluatePromotionResult {
  applicable: boolean;
  promotion: Promotion | null;
  discount: number;
  appliedRules: PromotionRule[];
}

export class EvaluatePromotionUseCase {
  constructor(
    private readonly promotionRepository: IPromotionRepository,
    private readonly promotionRuleRepository: IPromotionRuleRepository
  ) {}

  async execute(input: EvaluatePromotionInput): Promise<EvaluatePromotionResult> {
    try {
      // Get promotion
      const promotion = await this.promotionRepository.findById(input.promotionId);

      if (!promotion || !promotion.isValid()) {
        return {
          applicable: false,
          promotion: null,
          discount: 0,
          appliedRules: [],
        };
      }

      // Get promotion rules (sorted by priority)
      const rules = await this.promotionRuleRepository.findByPromotionId(input.promotionId);
      rules.sort((a, b) => b.priority - a.priority);

      // Evaluate rules
      for (const rule of rules) {
        if (this.evaluateConditions(rule.conditions, input.cartItems, input.cartTotal)) {
          const discount = this.applyActions(rule.actions, input.cartItems, input.cartTotal, promotion.type);
          
          if (discount > 0) {
            return {
              applicable: true,
              promotion,
              discount,
              appliedRules: [rule],
            };
          }
        }
      }

      return {
        applicable: false,
        promotion,
        discount: 0,
        appliedRules: [],
      };
    } catch (error) {
      logger.error('Error evaluating promotion', {
        promotionId: input.promotionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        applicable: false,
        promotion: null,
        discount: 0,
        appliedRules: [],
      };
    }
  }

  private evaluateConditions(
    conditions: Record<string, any>,
    cartItems: CartItem[],
    cartTotal: number
  ): boolean {
    const conditionType = conditions.type;

    switch (conditionType) {
      case 'buy_quantity':
        const requiredProductIds = conditions.productIds || [];
        const requiredQuantity = conditions.quantity || 0;
        
        if (requiredProductIds.length === 0) {
          // Check total quantity across all items
          const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          return totalQuantity >= requiredQuantity;
        } else {
          // Check quantity for specific products
          const matchingItems = cartItems.filter(item =>
            requiredProductIds.includes(item.productId)
          );
          const totalMatchingQuantity = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
          return totalMatchingQuantity >= requiredQuantity;
        }

      case 'spend_amount':
        const requiredAmount = conditions.amount || 0;
        return cartTotal >= requiredAmount;

      case 'product_match':
        const matchProductIds = conditions.productIds || [];
        return cartItems.some(item => matchProductIds.includes(item.productId));

      case 'category_match':
        const matchCategoryIds = conditions.categoryIds || [];
        return cartItems.some(item =>
          item.categoryIds && item.categoryIds.some(catId => matchCategoryIds.includes(catId))
        );

      default:
        logger.warn('Unknown condition type', { type: conditionType });
        return false;
    }
  }

  private applyActions(
    actions: Record<string, any>,
    _cartItems: CartItem[],
    cartTotal: number,
    _promotionType: PromotionType
  ): number {
    const actionType = actions.type;

    switch (actionType) {
      case 'discount':
        if (actions.discountType === 'percentage') {
          const discount = (cartTotal * actions.discountValue) / 100;
          return Math.min(discount, cartTotal);
        } else if (actions.discountType === 'fixed_amount') {
          return Math.min(actions.discountValue, cartTotal);
        }
        return 0;

      case 'free_item':
        // For buy X get Y, calculate value of free items
        // This is simplified - in production, you'd need to identify which items are free
        return 0;

      case 'bundle_discount':
        // Calculate bundle discount based on promotion configuration
        return 0;

      default:
        logger.warn('Unknown action type', { type: actionType });
        return 0;
    }
  }
}

