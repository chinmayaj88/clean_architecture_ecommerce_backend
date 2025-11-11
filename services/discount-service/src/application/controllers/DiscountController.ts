import { Response } from 'express';
import { ValidateCouponUseCase } from '../../core/use-cases/ValidateCouponUseCase';
import { CalculateDiscountUseCase } from '../../core/use-cases/CalculateDiscountUseCase';
import { ApplyCouponUseCase } from '../../core/use-cases/ApplyCouponUseCase';
import { EvaluatePromotionUseCase, CartItem } from '../../core/use-cases/EvaluatePromotionUseCase';
import { ApplyPromotionUseCase } from '../../core/use-cases/ApplyPromotionUseCase';
import { ICartServiceClient } from '../../infrastructure/clients/CartServiceClient';
import { IPromotionRepository } from '../../ports/interfaces/IPromotionRepository';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';
import { sendSuccess } from '../utils/response.util';

export class DiscountController {
  constructor(
    private readonly validateCouponUseCase: ValidateCouponUseCase,
    private readonly calculateDiscountUseCase: CalculateDiscountUseCase,
    private readonly applyCouponUseCase: ApplyCouponUseCase,
    private readonly evaluatePromotionUseCase: EvaluatePromotionUseCase,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly _applyPromotionUseCase: ApplyPromotionUseCase,
    private readonly cartServiceClient: ICartServiceClient,
    private readonly promotionRepository: IPromotionRepository
  ) {}

  /**
   * Validate coupon code
   * POST /api/v1/discounts/validate
   */
  async validateCoupon(req: RequestWithId, res: Response): Promise<void> {
    try {
      const validation = await this.validateCouponUseCase.execute({
        code: req.body.code,
        userId: req.body.userId || null,
        orderAmount: req.body.orderAmount,
        productIds: req.body.productIds,
        categoryIds: req.body.categoryIds,
      });

      if (!validation.valid) {
        throw new AppError(400, validation.error || 'Invalid coupon');
      }

      sendSuccess(res, 'Coupon is valid', {
        coupon: validation.coupon,
        discount: validation.discount,
      });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to validate coupon');
    }
  }

  /**
   * Calculate discount amount
   * POST /api/v1/discounts/calculate
   */
  async calculateDiscount(req: RequestWithId, res: Response): Promise<void> {
    try {
      if (!req.body.coupon) {
        throw new AppError(400, 'Coupon is required');
      }

      const discountResult = await this.calculateDiscountUseCase.execute({
        coupon: req.body.coupon,
        orderAmount: req.body.orderAmount,
        shippingCost: req.body.shippingCost,
      });

      sendSuccess(res, 'Discount calculated successfully', discountResult);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to calculate discount');
    }
  }

  /**
   * Apply coupon to cart
   * POST /api/v1/discounts/apply
   */
  async applyCoupon(req: RequestWithId, res: Response): Promise<void> {
    try {
      const result = await this.applyCouponUseCase.execute({
        code: req.body.code,
        userId: req.body.userId || null,
        orderId: req.body.orderId || null,
        orderAmount: req.body.orderAmount,
        shippingCost: req.body.shippingCost,
        productIds: req.body.productIds,
        categoryIds: req.body.categoryIds,
      });

      if (!result.success) {
        throw new AppError(400, result.error || 'Failed to apply coupon');
      }

      // Update cart if cartId is provided
      if (req.body.cartId) {
        await this.cartServiceClient.updateCartDiscount(
          req.body.cartId,
          result.discount,
          req.body.code
        );
      }

      sendSuccess(res, 'Coupon applied successfully', {
        couponId: result.couponId,
        discount: result.discount,
      });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to apply coupon');
    }
  }

  /**
   * Evaluate applicable promotions for cart
   * POST /api/v1/discounts/evaluate-promotions
   */
  async evaluatePromotions(req: RequestWithId, res: Response): Promise<void> {
    try {
      const cartItems: CartItem[] = req.body.cartItems || [];
      const cartTotal = req.body.cartTotal || 0;

      // Get all active promotions
      const promotions = await this.promotionRepository.findActive();

      const applicablePromotions = [];

      for (const promotion of promotions) {
        const evaluation = await this.evaluatePromotionUseCase.execute({
          promotionId: promotion.id,
          cartItems,
          cartTotal,
        });

        if (evaluation.applicable) {
          applicablePromotions.push({
            promotionId: promotion.id,
            promotionName: promotion.name,
            discount: evaluation.discount,
            type: promotion.type,
          });
        }
      }

      sendSuccess(res, 'Promotions evaluated successfully', {
        applicablePromotions,
      });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to evaluate promotions');
    }
  }
}

