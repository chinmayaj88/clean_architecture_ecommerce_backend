/**
 * Track Product View Use Case
 * Increments view count and tracks in recently viewed
 */

import { IProductRepository } from '../../ports/interfaces/IProductRepository';

export class TrackProductViewUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(productId: string): Promise<void> {
    // Increment view count
    await this.productRepository.incrementViewCount(productId);
  }
}

