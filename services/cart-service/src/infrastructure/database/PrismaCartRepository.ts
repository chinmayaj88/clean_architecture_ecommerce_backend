import { PrismaClient } from '@prisma/client';
import { ICartRepository, CreateCartData, UpdateCartData } from '../../ports/interfaces/ICartRepository';
import { Cart, CartStatus } from '../../core/entities/Cart';
import { getCache } from '../cache/RedisCache';

const CACHE_TTL = {
  CART_BY_ID: 600, // 10 minutes
  CART_BY_USER_ID: 600, // 10 minutes
  CART_BY_SESSION_ID: 600, // 10 minutes
};

export class PrismaCartRepository implements ICartRepository {
  private cache = getCache();

  constructor(private readonly prisma: PrismaClient) {}

  async create(cart: CreateCartData): Promise<Cart> {
    const created = await this.prisma.cart.create({
      data: {
        userId: cart.userId,
        sessionId: cart.sessionId,
        status: cart.status,
        currency: cart.currency,
        subtotal: cart.subtotal,
        taxAmount: cart.taxAmount,
        shippingAmount: cart.shippingAmount,
        discountAmount: cart.discountAmount,
        totalAmount: cart.totalAmount,
        couponCode: cart.couponCode,
        metadata: cart.metadata || undefined,
        expiresAt: cart.expiresAt,
        convertedAt: cart.convertedAt,
      },
    });

    const entity = Cart.fromPrisma(created);
    
    // Invalidate cache
    await this.invalidateCacheById(entity.id, entity.userId, entity.sessionId);

    return entity;
  }

  async findById(id: string): Promise<Cart | null> {
    const cacheKey = `cart:id:${id}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return Cart.fromPrisma(cached);
    }

    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!cart) {
      return null;
    }

    const entity = Cart.fromPrisma(cart);
    await this.cache.set(cacheKey, cart, CACHE_TTL.CART_BY_ID);

    return entity;
  }

  async findByUserId(userId: string, status?: CartStatus): Promise<Cart | null> {
    const cacheKey = `cart:userId:${userId}:${status || 'active'}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return Cart.fromPrisma(cached);
    }

    const cart = await this.prisma.cart.findFirst({
      where: {
        userId,
        ...(status && { status }),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!cart) {
      return null;
    }

    const entity = Cart.fromPrisma(cart);
    await this.cache.set(cacheKey, cart, CACHE_TTL.CART_BY_USER_ID);

    return entity;
  }

  async findBySessionId(sessionId: string, status?: CartStatus): Promise<Cart | null> {
    const cacheKey = `cart:sessionId:${sessionId}:${status || 'active'}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return Cart.fromPrisma(cached);
    }

    const cart = await this.prisma.cart.findFirst({
      where: {
        sessionId,
        ...(status && { status }),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!cart) {
      return null;
    }

    const entity = Cart.fromPrisma(cart);
    await this.cache.set(cacheKey, cart, CACHE_TTL.CART_BY_SESSION_ID);

    return entity;
  }

  async update(id: string, data: UpdateCartData): Promise<Cart> {
    const updateData: any = {};
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.sessionId !== undefined) updateData.sessionId = data.sessionId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
    if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount;
    if (data.shippingAmount !== undefined) updateData.shippingAmount = data.shippingAmount;
    if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.couponCode !== undefined) updateData.couponCode = data.couponCode;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.convertedAt !== undefined) updateData.convertedAt = data.convertedAt;

    const updated = await this.prisma.cart.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    const entity = Cart.fromPrisma(updated);
    await this.invalidateCache(entity);

    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.cart.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cache.delPattern(`cart:id:${id}*`);
    await this.cache.delPattern(`cart:userId:*`);
    await this.cache.delPattern(`cart:sessionId:*`);
  }

  async markAsAbandoned(id: string): Promise<void> {
    await this.prisma.cart.update({
      where: { id },
      data: { status: CartStatus.ABANDONED },
    });

    await this.cache.delPattern(`cart:id:${id}*`);
  }

  async markAsConverted(id: string, orderId?: string): Promise<void> {
    await this.prisma.cart.update({
      where: { id },
      data: {
        status: CartStatus.CONVERTED,
        convertedAt: new Date(),
        metadata: orderId ? { orderId } : undefined,
      },
    });

    await this.cache.delPattern(`cart:id:${id}*`);
  }

  async findExpiredCarts(): Promise<Cart[]> {
    const carts = await this.prisma.cart.findMany({
      where: {
        status: CartStatus.ACTIVE,
        expiresAt: {
          lte: new Date(),
        },
      },
      include: { items: true },
    });

    return carts.map((cart: any) => Cart.fromPrisma(cart));
  }

  async deleteExpiredCarts(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.cart.deleteMany({
      where: {
        status: CartStatus.ABANDONED,
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  private async invalidateCache(cart: Cart): Promise<void> {
    await this.cache.delPattern(`cart:id:${cart.id}*`);
    if (cart.userId) {
      await this.cache.delPattern(`cart:userId:${cart.userId}*`);
    }
    if (cart.sessionId) {
      await this.cache.delPattern(`cart:sessionId:${cart.sessionId}*`);
    }
  }

  private async invalidateCacheById(cartId: string, userId?: string | null, sessionId?: string | null): Promise<void> {
    await this.cache.delPattern(`cart:id:${cartId}*`);
    if (userId) {
      await this.cache.delPattern(`cart:userId:${userId}*`);
    }
    if (sessionId) {
      await this.cache.delPattern(`cart:sessionId:${sessionId}*`);
    }
  }
}

