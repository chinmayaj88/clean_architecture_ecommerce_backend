/**
 * Track Product View Use Case
 * Records when a user views a product
 */

import { IRecentlyViewedProductRepository } from '../../ports/interfaces/IRecentlyViewedProductRepository';
import { IUserActivityRepository } from '../../ports/interfaces/IUserActivityRepository';
import { RecentlyViewedProduct } from '../../core/entities/RecentlyViewedProduct';

export class TrackProductViewUseCase {
  constructor(
    private readonly recentlyViewedRepository: IRecentlyViewedProductRepository,
    private readonly activityRepository: IUserActivityRepository
  ) {}

  async execute(
    userId: string,
    productId: string,
    productData?: {
      productName?: string;
      productImageUrl?: string;
      productPrice?: number;
    },
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<RecentlyViewedProduct> {
    // Track in recently viewed
    const viewed = await this.recentlyViewedRepository.upsert({
      userId,
      productId,
      productName: productData?.productName,
      productImageUrl: productData?.productImageUrl,
      productPrice: productData?.productPrice,
    });

    // Track as activity
    await this.activityRepository.create({
      userId,
      activityType: 'product_viewed',
      entityType: 'product',
      entityId: productId,
      metadata: {
        productId,
        productName: productData?.productName,
      },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    }).catch(() => {
      // Don't fail if activity tracking fails
    });

    return viewed;
  }
}

