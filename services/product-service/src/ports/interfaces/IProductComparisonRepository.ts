/**
 * Product Comparison Repository Interface
 */

import { ProductComparison, CreateProductComparisonData } from '../../core/entities/ProductComparison';

export interface IProductComparisonRepository {
  /**
   * Create a comparison
   */
  create(data: CreateProductComparisonData): Promise<ProductComparison>;

  /**
   * Find comparison by ID
   */
  findById(id: string): Promise<ProductComparison | null>;

  /**
   * Find comparisons for a user
   */
  findByUserId(userId: string): Promise<ProductComparison[]>;

  /**
   * Update comparison
   */
  update(id: string, updates: Partial<ProductComparison>): Promise<ProductComparison>;

  /**
   * Delete comparison
   */
  delete(id: string): Promise<void>;

  /**
   * Find comparison by user and product IDs
   */
  findByUserAndProducts(userId: string, productIds: string[]): Promise<ProductComparison | null>;
}

