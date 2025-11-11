import { ICouponRepository } from '../../ports/interfaces/ICouponRepository';
import { ICouponUsageRepository } from '../../ports/interfaces/ICouponUsageRepository';
import { ValidateCouponUseCase } from './ValidateCouponUseCase';
import { CalculateDiscountUseCase } from './CalculateDiscountUseCase';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface ApplyCouponInput {
  code: string;
  userId?: string | null;
  orderId?: string | null;
  orderAmount: number;
  shippingCost?: number;
  productIds?: string[];
  categoryIds?: string[];
}

export interface ApplyCouponResult {
  success: boolean;
  couponId: string | null;
  discount: number;
  error?: string;
}

export class ApplyCouponUseCase {
  constructor(
    private readonly couponRepository: ICouponRepository,
    private readonly couponUsageRepository: ICouponUsageRepository,
    private readonly validateCouponUseCase: ValidateCouponUseCase,
    private readonly calculateDiscountUseCase: CalculateDiscountUseCase
  ) {}

  async execute(input: ApplyCouponInput): Promise<ApplyCouponResult> {
    try {
      // Validate coupon
      const validation = await this.validateCouponUseCase.execute({
        code: input.code,
        userId: input.userId,
        orderAmount: input.orderAmount,
        productIds: input.productIds,
        categoryIds: input.categoryIds,
      });

      if (!validation.valid || !validation.coupon) {
        return {
          success: false,
          couponId: null,
          discount: 0,
          error: validation.error || 'Invalid coupon',
        };
      }

      const coupon = validation.coupon;

      // Calculate discount
      const discountResult = await this.calculateDiscountUseCase.execute({
        coupon,
        orderAmount: input.orderAmount,
        shippingCost: input.shippingCost,
      });

      // Record coupon usage
      await this.couponUsageRepository.create({
        couponId: coupon.id,
        userId: input.userId || null,
        orderId: input.orderId || null,
        discountAmount: discountResult.discount,
      });

      // Increment usage count
      await this.couponRepository.incrementUsageCount(coupon.id);

      logger.info('Coupon applied successfully', {
        couponId: coupon.id,
        couponCode: coupon.code,
        userId: input.userId,
        orderId: input.orderId,
        discount: discountResult.discount,
      });

      return {
        success: true,
        couponId: coupon.id,
        discount: discountResult.discount,
      };
    } catch (error) {
      logger.error('Error applying coupon', {
        code: input.code,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        couponId: null,
        discount: 0,
        error: 'Failed to apply coupon',
      };
    }
  }
}

