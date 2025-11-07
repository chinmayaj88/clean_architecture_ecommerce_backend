/**
 * Get Product Comparison Use Case
 */

import { IProductComparisonRepository } from '../../ports/interfaces/IProductComparisonRepository';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { Product } from '../../core/entities/Product';
import { ProductComparison } from '../../core/entities/ProductComparison';

export class GetProductComparisonUseCase {
  constructor(
    private readonly productComparisonRepository: IProductComparisonRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(comparisonId: string): Promise<{ comparison: ProductComparison; products: Product[] }> {
    const comparison = await this.productComparisonRepository.findById(comparisonId);
    if (!comparison) {
      throw new Error('Comparison not found');
    }

    // Fetch all products
    const products = await Promise.all(
      comparison.productIds.map((id) => this.productRepository.findById(id))
    );

    const validProducts = products.filter((p): p is Product => p !== null);

    return {
      comparison,
      products: validProducts,
    };
  }

  async executeByUserId(userId: string): Promise<ProductComparison[]> {
    return this.productComparisonRepository.findByUserId(userId);
  }
}

