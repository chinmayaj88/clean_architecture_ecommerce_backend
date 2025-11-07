/**
 * Prisma Recently Viewed Product Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IRecentlyViewedProductRepository } from '../../ports/interfaces/IRecentlyViewedProductRepository';
import { RecentlyViewedProduct, CreateRecentlyViewedProductData } from '../../core/entities/RecentlyViewedProduct';

export class PrismaRecentlyViewedProductRepository implements IRecentlyViewedProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(data: CreateRecentlyViewedProductData): Promise<RecentlyViewedProduct> {
    // Delete existing entry if exists (to update timestamp)
    await this.prisma.recentlyViewedProduct.deleteMany({
      where: {
        userId: data.userId,
        productId: data.productId,
      },
    });

    // Create new entry with current timestamp
    const viewed = await this.prisma.recentlyViewedProduct.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        productName: data.productName,
        productImageUrl: data.productImageUrl,
        productPrice: data.productPrice ? data.productPrice.toString() : null,
        viewedAt: new Date(),
      },
    });

    return this.mapToEntity(viewed);
  }

  async findByUserId(userId: string, limit = 20): Promise<RecentlyViewedProduct[]> {
    const views = await this.prisma.recentlyViewedProduct.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });

    return views.map((v) => this.mapToEntity(v));
  }

  async deleteOldViews(userId: string, daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.recentlyViewedProduct.deleteMany({
      where: {
        userId,
        viewedAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  async clearByUserId(userId: string): Promise<void> {
    await this.prisma.recentlyViewedProduct.deleteMany({
      where: { userId },
    });
  }

  private mapToEntity(viewed: any): RecentlyViewedProduct {
    return {
      id: viewed.id,
      userId: viewed.userId,
      productId: viewed.productId,
      productName: viewed.productName,
      productImageUrl: viewed.productImageUrl,
      productPrice: viewed.productPrice ? parseFloat(viewed.productPrice) : null,
      viewedAt: viewed.viewedAt,
    };
  }
}

