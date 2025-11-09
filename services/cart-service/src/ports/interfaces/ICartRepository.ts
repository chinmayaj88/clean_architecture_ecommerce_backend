import { Cart, CartStatus } from '../../core/entities/Cart';

export interface CreateCartData {
  userId: string | null;
  sessionId: string | null;
  status: CartStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponCode: string | null;
  metadata: Record<string, any> | null;
  expiresAt: Date | null;
  convertedAt: Date | null;
}

export interface UpdateCartData {
  userId?: string | null;
  sessionId?: string | null;
  status?: CartStatus;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  couponCode?: string | null;
  metadata?: Record<string, any> | null;
  expiresAt?: Date | null;
  convertedAt?: Date | null;
}

export interface ICartRepository {
  create(cart: CreateCartData): Promise<Cart>;
  findById(id: string): Promise<Cart | null>;
  findByUserId(userId: string, status?: CartStatus): Promise<Cart | null>;
  findBySessionId(sessionId: string, status?: CartStatus): Promise<Cart | null>;
  update(id: string, data: UpdateCartData): Promise<Cart>;
  delete(id: string): Promise<void>;
  markAsAbandoned(id: string): Promise<void>;
  markAsConverted(id: string, orderId?: string): Promise<void>;
  findExpiredCarts(): Promise<Cart[]>;
  deleteExpiredCarts(olderThanDays: number): Promise<number>;
}

