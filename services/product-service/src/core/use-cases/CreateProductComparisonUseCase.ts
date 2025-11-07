/**
 * Create Product Comparison Use Case
 */

import { IProductComparisonRepository } from '../../ports/interfaces/IProductComparisonRepository';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { ProductComparison, CreateProductComparisonData } from '../../core/entities/ProductComparison';

export class CreateProductComparisonUseCase {
  constructor(
    private readonly productComparisonRepository: IProductComparisonRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: CreateProductComparisonData): Promise<ProductComparison> {
    // Validate product count
    if (data.productIds.length < 2) {
      throw new Error('At least 2 products are required for comparison');
    }

    if (data.productIds.length > 4) {
      throw new Error('Maximum 4 products can be compared');
    }

    // Verify all products exist and are visible
    for (const productId of data.productIds) {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }
      if (!product.isVisible || product.status !== 'active') {
        throw new Error(`Product ${productId} is not available`);
      }
    }

    // Check if comparison already exists
    const existing = await this.productComparisonRepository.findByUserAndProducts(
      data.userId,
      data.productIds
    );

    if (existing) {
      return existing;
    }

    return this.productComparisonRepository.create(data);
  }
}

