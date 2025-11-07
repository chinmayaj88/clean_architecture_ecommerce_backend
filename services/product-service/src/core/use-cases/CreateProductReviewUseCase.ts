/**
 * Create Product Review Use Case
 */

import { IProductReviewRepository } from '../../ports/interfaces/IProductReviewRepository';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { ProductReview, CreateProductReviewData } from '../../core/entities/ProductReview';

export class CreateProductReviewUseCase {
  constructor(
    private readonly productReviewRepository: IProductReviewRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: CreateProductReviewData): Promise<ProductReview> {
    // Verify product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isVisible || product.status !== 'active') {
      throw new Error('Product is not available');
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return this.productReviewRepository.create(data);
  }
}

