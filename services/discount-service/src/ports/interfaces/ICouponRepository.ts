import { Coupon } from '../../core/entities/Coupon';

export interface CreateCouponData {
  code: string;
  name: string;
  description?: string | null;
  type: string;
  discountValue: number;
  minimumAmount?: number;
  maximumDiscount?: number | null;
  currency?: string;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
  applicableProducts?: string[] | null;
  applicableCategories?: string[] | null;
  excludedProducts?: string[] | null;
  metadata?: Record<string, any> | null;
}

export interface UpdateCouponData {
  name?: string;
  description?: string | null;
  type?: string;
  discountValue?: number;
  minimumAmount?: number;
  maximumDiscount?: number | null;
  currency?: string;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
  applicableProducts?: string[] | null;
  applicableCategories?: string[] | null;
  excludedProducts?: string[] | null;
  metadata?: Record<string, any> | null;
}

export interface CouponFilterOptions {
  isActive?: boolean;
  type?: string;
  code?: string;
  limit?: number;
  offset?: number;
}

export interface ICouponRepository {
  create(data: CreateCouponData): Promise<Coupon>;
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findAll(options?: CouponFilterOptions): Promise<Coupon[]>;
  update(id: string, data: UpdateCouponData): Promise<Coupon>;
  delete(id: string): Promise<void>;
  incrementUsageCount(id: string): Promise<Coupon>;
  activate(id: string): Promise<Coupon>;
  deactivate(id: string): Promise<Coupon>;
}

