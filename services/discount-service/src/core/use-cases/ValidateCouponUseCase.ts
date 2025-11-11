import { ICouponRepository } from '../../ports/interfaces/ICouponRepository';
import { ICouponUsageRepository } from '../../ports/interfaces/ICouponUsageRepository';
import { Coupon } from '../../core/entities/Coupon';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface ValidateCouponInput {
  code: string;
  userId?: string | null;
  orderAmount: number;
  productIds?: string[];
  categoryIds?: string[];
}

export interface ValidateCouponResult {
  valid: boolean;
  coupon: Coupon | null;
  discount: number;
  error?: string;
}

export class ValidateCouponUseCase {
  constructor(
    private readonly couponRepository: ICouponRepository,
    private readonly couponUsageRepository: ICouponUsageRepository
  ) {}

  async execute(input: ValidateCouponInput): Promise<ValidateCouponResult> {
    try {
      // Find coupon by code
      const coupon = await this.couponRepository.findByCode(input.code);

      if (!coupon) {
        return {
          valid: false,
          coupon: null,
          discount: 0,
          error: 'Coupon not found',
        };
      }

      // Check if coupon is valid (active and within date range)
      if (!coupon.isValid()) {
        return {
          valid: false,
          coupon,
          discount: 0,
          error: 'Coupon is not active or has expired',
        };
      }

      // Check minimum amount
      if (!coupon.meetsMinimumAmount(input.orderAmount)) {
        return {
          valid: false,
          coupon,
          discount: 0,
          error: `Minimum order amount required: ${coupon.currency} ${coupon.minimumAmount}`,
        };
      }

      // Check product eligibility
      if (input.productIds && input.productIds.length > 0) {
        const categoryIds = input.categoryIds || [];
        const applicableProducts = input.productIds.filter(productId =>
          coupon.isProductApplicable(productId, categoryIds)
        );

        if (applicableProducts.length === 0) {
          return {
            valid: false,
            coupon,
            discount: 0,
            error: 'Coupon is not applicable to any products in your cart',
          };
        }
      }

      // Check per-user usage limit
      if (input.userId && coupon.usageLimitPerUser !== null) {
        const userUsageCount = await this.couponUsageRepository.countByCouponAndUser(
          coupon.id,
          input.userId
        );

        if (!coupon.canBeUsedByUser(userUsageCount)) {
          return {
            valid: false,
            coupon,
            discount: 0,
            error: 'You have already used this coupon the maximum number of times',
          };
        }
      }

      // Calculate discount
      let discount = 0;
      if (coupon.type === 'PERCENTAGE') {
        discount = (input.orderAmount * coupon.discountValue) / 100;
        if (coupon.maximumDiscount) {
          discount = Math.min(discount, coupon.maximumDiscount);
        }
      } else if (coupon.type === 'FIXED_AMOUNT') {
        discount = coupon.discountValue;
      } else if (coupon.type === 'FREE_SHIPPING') {
        // Free shipping discount will be calculated when shipping cost is known
        // For now, return 0 and let the caller handle it
        discount = 0;
      }

      // Ensure discount doesn't exceed order amount
      discount = Math.min(discount, input.orderAmount);

      return {
        valid: true,
        coupon,
        discount,
      };
    } catch (error) {
      logger.error('Error validating coupon', {
        code: input.code,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        valid: false,
        coupon: null,
        discount: 0,
        error: 'Failed to validate coupon',
      };
    }
  }
}

