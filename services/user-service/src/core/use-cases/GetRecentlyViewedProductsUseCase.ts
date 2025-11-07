/**
 * Get Recently Viewed Products Use Case
 */

import { IRecentlyViewedProductRepository } from '../../ports/interfaces/IRecentlyViewedProductRepository';
import { RecentlyViewedProduct } from '../../core/entities/RecentlyViewedProduct';

export class GetRecentlyViewedProductsUseCase {
  constructor(private readonly recentlyViewedRepository: IRecentlyViewedProductRepository) {}

  async execute(userId: string, limit = 20): Promise<RecentlyViewedProduct[]> {
    return this.recentlyViewedRepository.findByUserId(userId, limit);
  }
}

