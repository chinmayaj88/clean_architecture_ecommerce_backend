/**
 * Search Products Use Case
 * Advanced search with filters
 */

import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { IProductSearchHistoryRepository } from '../../ports/interfaces/IProductSearchHistoryRepository';
import { Product } from '../../core/entities/Product';

export class SearchProductsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly searchHistoryRepository?: IProductSearchHistoryRepository
  ) {}

  async execute(
    query: string,
    filters?: {
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      inStock?: boolean;
      badges?: string[];
      sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity' | 'relevance';
      page?: number;
      limit?: number;
    }
  ): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const result = await this.productRepository.search(query, {
      ...filters,
      page,
      limit,
    });

    // Track search history (fire and forget)
    if (this.searchHistoryRepository) {
      this.searchHistoryRepository.create({
        query,
        filters: filters || null,
        resultsCount: result.total,
        userId: null, // Could be passed from auth context
        productId: null,
      }).catch((error) => {
        // Log error but don't fail the search
        console.error('Failed to track search history:', error);
      });
    }

    return {
      products: result.products,
      total: result.total,
      page,
      limit,
    };
  }
}

