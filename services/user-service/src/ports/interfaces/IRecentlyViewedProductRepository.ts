/**
 * Recently Viewed Product Repository Interface
 */

import { RecentlyViewedProduct, CreateRecentlyViewedProductData } from '../../core/entities/RecentlyViewedProduct';

export interface IRecentlyViewedProductRepository {
  /**
   * Create or update recently viewed product
   */
  upsert(data: CreateRecentlyViewedProductData): Promise<RecentlyViewedProduct>;

  /**
   * Get recently viewed products for a user
   */
  findByUserId(userId: string, limit?: number): Promise<RecentlyViewedProduct[]>;

  /**
   * Delete old views (cleanup)
   */
  deleteOldViews(userId: string, daysToKeep?: number): Promise<number>;

  /**
   * Clear all views for a user
   */
  clearByUserId(userId: string): Promise<void>;
}

