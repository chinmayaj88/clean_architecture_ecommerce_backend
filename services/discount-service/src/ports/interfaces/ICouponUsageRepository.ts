import { CouponUsage } from '../../core/entities/CouponUsage';

export interface CreateCouponUsageData {
  couponId: string;
  userId?: string | null;
  orderId?: string | null;
  discountAmount: number;
}

export interface ICouponUsageRepository {
  create(data: CreateCouponUsageData): Promise<CouponUsage>;
  findById(id: string): Promise<CouponUsage | null>;
  findByCouponId(couponId: string, options?: { limit?: number; offset?: number }): Promise<CouponUsage[]>;
  findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<CouponUsage[]>;
  findByOrderId(orderId: string): Promise<CouponUsage | null>;
  countByCouponAndUser(couponId: string, userId: string): Promise<number>;
  countByCoupon(couponId: string): Promise<number>;
}

