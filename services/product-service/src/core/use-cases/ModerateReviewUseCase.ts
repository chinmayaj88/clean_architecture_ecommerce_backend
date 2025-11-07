/**
 * Moderate Review Use Case
 */

import { IProductReviewRepository } from '../../ports/interfaces/IProductReviewRepository';

export class ModerateReviewUseCase {
  constructor(private readonly productReviewRepository: IProductReviewRepository) {}

  async approve(reviewId: string): Promise<void> {
    const review = await this.productReviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    await this.productReviewRepository.approve(reviewId);
  }

  async reject(reviewId: string): Promise<void> {
    const review = await this.productReviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    await this.productReviewRepository.reject(reviewId);
  }

  async getPendingReviews(limit = 50): Promise<any[]> {
    return this.productReviewRepository.findPendingReviews(limit);
  }
}

