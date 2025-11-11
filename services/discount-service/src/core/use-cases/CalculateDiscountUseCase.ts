import { Coupon, CouponType } from '../../core/entities/Coupon';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface CalculateDiscountInput {
  coupon: Coupon;
  orderAmount: number;
  shippingCost?: number;
}

export interface CalculateDiscountResult {
  discount: number;
  type: string;
}

export class CalculateDiscountUseCase {
  async execute(input: CalculateDiscountInput): Promise<CalculateDiscountResult> {
    try {
      let discount = 0;

      switch (input.coupon.type) {
        case CouponType.PERCENTAGE:
          discount = (input.orderAmount * input.coupon.discountValue) / 100;
          if (input.coupon.maximumDiscount) {
            discount = Math.min(discount, input.coupon.maximumDiscount);
          }
          break;

        case CouponType.FIXED_AMOUNT:
          discount = input.coupon.discountValue;
          break;

        case CouponType.FREE_SHIPPING:
          discount = input.shippingCost || 0;
          break;

        default:
          logger.warn('Unknown coupon type', { type: input.coupon.type });
          discount = 0;
      }

      // Ensure discount doesn't exceed order amount
      discount = Math.min(discount, input.orderAmount);

      return {
        discount,
        type: input.coupon.type,
      };
    } catch (error) {
      logger.error('Error calculating discount', {
        couponId: input.coupon.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        discount: 0,
        type: input.coupon.type,
      };
    }
  }
}

