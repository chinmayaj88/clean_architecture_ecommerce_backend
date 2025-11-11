import { Response } from 'express';
import { ICouponRepository } from '../../ports/interfaces/ICouponRepository';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';
import { sendSuccess, sendCreated } from '../utils/response.util';

export class CouponController {
  constructor(
    private readonly couponRepository: ICouponRepository
  ) {}

  /**
   * Create a coupon
   * POST /api/v1/coupons
   */
  async createCoupon(req: RequestWithId, res: Response): Promise<void> {
    try {
      const coupon = await this.couponRepository.create({
        code: req.body.code,
        name: req.body.name,
        description: req.body.description || null,
        type: req.body.type,
        discountValue: req.body.discountValue,
        minimumAmount: req.body.minimumAmount || 0,
        maximumDiscount: req.body.maximumDiscount || null,
        currency: req.body.currency || 'USD',
        usageLimit: req.body.usageLimit || null,
        usageLimitPerUser: req.body.usageLimitPerUser || null,
        startsAt: req.body.startsAt ? new Date(req.body.startsAt) : null,
        endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        applicableProducts: req.body.applicableProducts || null,
        applicableCategories: req.body.applicableCategories || null,
        excludedProducts: req.body.excludedProducts || null,
        metadata: req.body.metadata || null,
      });

      sendCreated(res, 'Coupon created successfully', coupon);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new AppError(409, 'Coupon with this code already exists');
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to create coupon');
    }
  }

  /**
   * Get all coupons
   * GET /api/v1/coupons
   */
  async getCoupons(req: RequestWithId, res: Response): Promise<void> {
    try {
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const type = req.query.type as string | undefined;
      const code = req.query.code as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const coupons = await this.couponRepository.findAll({
        isActive,
        type,
        code,
        limit,
        offset,
      });

      sendSuccess(res, 'Coupons retrieved successfully', coupons);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get coupons');
    }
  }

  /**
   * Get coupon by ID
   * GET /api/v1/coupons/:id
   */
  async getCoupon(req: RequestWithId, res: Response): Promise<void> {
    try {
      const couponId = req.params.id;
      const coupon = await this.couponRepository.findById(couponId);

      if (!coupon) {
        throw new AppError(404, 'Coupon not found');
      }

      sendSuccess(res, 'Coupon retrieved successfully', coupon);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get coupon');
    }
  }

  /**
   * Get coupon by code
   * GET /api/v1/coupons/code/:code
   */
  async getCouponByCode(req: RequestWithId, res: Response): Promise<void> {
    try {
      const code = req.params.code;
      const coupon = await this.couponRepository.findByCode(code);

      if (!coupon) {
        throw new AppError(404, 'Coupon not found');
      }

      sendSuccess(res, 'Coupon retrieved successfully', coupon);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get coupon');
    }
  }

  /**
   * Update coupon
   * PUT /api/v1/coupons/:id
   */
  async updateCoupon(req: RequestWithId, res: Response): Promise<void> {
    try {
      const couponId = req.params.id;
      const coupon = await this.couponRepository.findById(couponId);

      if (!coupon) {
        throw new AppError(404, 'Coupon not found');
      }

      const updatedCoupon = await this.couponRepository.update(couponId, {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        discountValue: req.body.discountValue,
        minimumAmount: req.body.minimumAmount,
        maximumDiscount: req.body.maximumDiscount,
        currency: req.body.currency,
        usageLimit: req.body.usageLimit,
        usageLimitPerUser: req.body.usageLimitPerUser,
        startsAt: req.body.startsAt ? new Date(req.body.startsAt) : undefined,
        endsAt: req.body.endsAt ? new Date(req.body.endsAt) : undefined,
        isActive: req.body.isActive,
        applicableProducts: req.body.applicableProducts,
        applicableCategories: req.body.applicableCategories,
        excludedProducts: req.body.excludedProducts,
        metadata: req.body.metadata,
      });

      sendSuccess(res, 'Coupon updated successfully', updatedCoupon);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new AppError(409, 'Coupon with this code already exists');
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to update coupon');
    }
  }

  /**
   * Delete coupon
   * DELETE /api/v1/coupons/:id
   */
  async deleteCoupon(req: RequestWithId, res: Response): Promise<void> {
    try {
      const couponId = req.params.id;
      const coupon = await this.couponRepository.findById(couponId);

      if (!coupon) {
        throw new AppError(404, 'Coupon not found');
      }

      await this.couponRepository.delete(couponId);
      sendSuccess(res, 'Coupon deleted successfully', null);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to delete coupon');
    }
  }

  /**
   * Activate coupon
   * POST /api/v1/coupons/:id/activate
   */
  async activateCoupon(req: RequestWithId, res: Response): Promise<void> {
    try {
      const couponId = req.params.id;
      const coupon = await this.couponRepository.findById(couponId);

      if (!coupon) {
        throw new AppError(404, 'Coupon not found');
      }

      const activatedCoupon = await this.couponRepository.activate(couponId);
      sendSuccess(res, 'Coupon activated successfully', activatedCoupon);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to activate coupon');
    }
  }

  /**
   * Deactivate coupon
   * POST /api/v1/coupons/:id/deactivate
   */
  async deactivateCoupon(req: RequestWithId, res: Response): Promise<void> {
    try {
      const couponId = req.params.id;
      const coupon = await this.couponRepository.findById(couponId);

      if (!coupon) {
        throw new AppError(404, 'Coupon not found');
      }

      const deactivatedCoupon = await this.couponRepository.deactivate(couponId);
      sendSuccess(res, 'Coupon deactivated successfully', deactivatedCoupon);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to deactivate coupon');
    }
  }
}

