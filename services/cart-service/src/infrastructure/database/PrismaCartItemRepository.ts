import { PrismaClient } from '@prisma/client';
import { ICartItemRepository, CreateCartItemData, UpdateCartItemData } from '../../ports/interfaces/ICartItemRepository';
import { CartItem } from '../../core/entities/CartItem';
import { getCache } from '../cache/RedisCache';

const CACHE_TTL = {
  ITEMS_BY_CART_ID: 600, // 10 minutes
};

export class PrismaCartItemRepository implements ICartItemRepository {
  private cache = getCache();

  constructor(private readonly prisma: PrismaClient) {}

  async create(item: CreateCartItemData): Promise<CartItem> {
    const created = await this.prisma.cartItem.create({
      data: {
        cartId: item.cartId,
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.productName,
        productSku: item.productSku,
        productImageUrl: item.productImageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        metadata: item.metadata || undefined,
      },
    });

    const entity = CartItem.fromPrisma(created);
    
    // Invalidate cache
    await this.cache.delPattern(`cartItems:cartId:${item.cartId}*`);

    return entity;
  }

  async findById(id: string): Promise<CartItem | null> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id },
    });

    if (!item) {
      return null;
    }

    return CartItem.fromPrisma(item);
  }

  async findByCartId(cartId: string): Promise<CartItem[]> {
    const cacheKey = `cartItems:cartId:${cartId}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached.map((item) => CartItem.fromPrisma(item));
    }

    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      orderBy: { createdAt: 'asc' },
    });

    const entities = items.map((item: any) => CartItem.fromPrisma(item));
    await this.cache.set(cacheKey, items, CACHE_TTL.ITEMS_BY_CART_ID);

    return entities;
  }

  async findByCartIdAndProductId(
    cartId: string,
    productId: string,
    variantId?: string | null
  ): Promise<CartItem | null> {
    // Prisma requires explicit null for optional fields in unique constraints
    // Use undefined if variantId is not provided, null if explicitly null
    const item = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId,
          productId,
          variantId: variantId ?? null,
        },
      },
    } as any);

    if (!item) {
      return null;
    }

    return CartItem.fromPrisma(item);
  }

  async update(id: string, data: UpdateCartItemData): Promise<CartItem> {
    const updateData: any = {};
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
    if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updated = await this.prisma.cartItem.update({
      where: { id },
      data: updateData,
    });

    const entity = CartItem.fromPrisma(updated);
    
    // Invalidate cache
    await this.cache.delPattern(`cartItems:cartId:${entity.cartId}*`);

    return entity;
  }

  async delete(id: string): Promise<void> {
    const item = await this.findById(id);
    if (!item) {
      return;
    }

    await this.prisma.cartItem.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cache.delPattern(`cartItems:cartId:${item.cartId}*`);
  }

  async deleteByCartId(cartId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });

    // Invalidate cache
    await this.cache.delPattern(`cartItems:cartId:${cartId}*`);
  }

  async countByCartId(cartId: string): Promise<number> {
    return await this.prisma.cartItem.count({
      where: { cartId },
    });
  }
}

