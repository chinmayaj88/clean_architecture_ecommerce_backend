/**
 * Prisma Wishlist Item Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IWishlistItemRepository } from '../../ports/interfaces/IWishlistItemRepository';
import { WishlistItem, CreateWishlistItemData, UpdateWishlistItemData } from '../../core/entities/WishlistItem';

export class PrismaWishlistItemRepository implements IWishlistItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateWishlistItemData): Promise<WishlistItem> {
    const wishlistItem = await this.prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: data.userId,
          productId: data.productId,
        },
      },
      create: {
        userId: data.userId,
        productId: data.productId,
        productName: data.productName,
        productImageUrl: data.productImageUrl,
        productPrice: data.productPrice,
        notes: data.notes,
      },
      update: {
        notes: data.notes,
        productName: data.productName,
        productImageUrl: data.productImageUrl,
        productPrice: data.productPrice,
      },
    });

    return this.mapToEntity(wishlistItem);
  }

  async findById(id: string): Promise<WishlistItem | null> {
    const wishlistItem = await this.prisma.wishlistItem.findUnique({
      where: { id },
    });

    return wishlistItem ? this.mapToEntity(wishlistItem) : null;
  }

  async findByUserId(userId: string): Promise<WishlistItem[]> {
    const wishlistItems = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return wishlistItems.map((item: any) => this.mapToEntity(item));
  }

  async findByUserIdAndProductId(userId: string, productId: string): Promise<WishlistItem | null> {
    const wishlistItem = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return wishlistItem ? this.mapToEntity(wishlistItem) : null;
  }

  async update(id: string, data: UpdateWishlistItemData): Promise<WishlistItem> {
    const wishlistItem = await this.prisma.wishlistItem.update({
      where: { id },
      data: {
        notes: data.notes,
      },
    });

    return this.mapToEntity(wishlistItem);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.wishlistItem.delete({
      where: { id },
    });
  }

  async deleteByUserIdAndProductId(userId: string, productId: string): Promise<void> {
    await this.prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  async exists(userId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.wishlistItem.count({
      where: {
        userId,
        productId,
      },
    });
    return count > 0;
  }

  private mapToEntity(item: {
    id: string;
    userId: string;
    productId: string;
    productName: string | null;
    productImageUrl: string | null;
    productPrice: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): WishlistItem {
    return {
      id: item.id,
      userId: item.userId,
      productId: item.productId,
      productName: item.productName ?? undefined,
      productImageUrl: item.productImageUrl ?? undefined,
      productPrice: item.productPrice ?? undefined,
      notes: item.notes ?? undefined,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

