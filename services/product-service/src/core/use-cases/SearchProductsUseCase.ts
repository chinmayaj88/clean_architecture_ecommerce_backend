/**
 * Search Products Use Case
 * Advanced search with filters
 */

import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { Product } from '../../core/entities/Product';

export class SearchProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

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

    return {
      products: result.products,
      total: result.total,
      page,
      limit,
    };
  }
}

