/**
 * Create Product Question Use Case
 */

import { IProductQuestionRepository } from '../../ports/interfaces/IProductQuestionRepository';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { ProductQuestion, CreateProductQuestionData } from '../../core/entities/ProductQuestion';

export class CreateProductQuestionUseCase {
  constructor(
    private readonly productQuestionRepository: IProductQuestionRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: CreateProductQuestionData): Promise<ProductQuestion> {
    // Verify product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isVisible || product.status !== 'active') {
      throw new Error('Product is not available');
    }

    return this.productQuestionRepository.create(data);
  }
}

