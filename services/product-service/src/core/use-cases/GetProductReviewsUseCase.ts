/**
 * Get Product Reviews Use Case
 */

import { IProductReviewRepository } from '../../ports/interfaces/IProductReviewRepository';
import { ProductReview } from '../../core/entities/ProductReview';

export class GetProductReviewsUseCase {
  constructor(private readonly productReviewRepository: IProductReviewRepository) {}

  async execute(
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      isApproved?: boolean;
      rating?: number;
      sortBy?: 'newest' | 'oldest' | 'rating' | 'helpful';
    }
  ): Promise<{ reviews: ProductReview[]; total: number; averageRating: number; ratingDistribution: Record<number, number> }> {
    const [reviews, total, averageRating, ratingDistribution] = await Promise.all([
      this.productReviewRepository.findByProductId(productId, options),
      this.productReviewRepository.countByProductId(productId, {
        isApproved: options?.isApproved,
        rating: options?.rating,
      }),
      this.productReviewRepository.getAverageRating(productId),
      this.productReviewRepository.getRatingDistribution(productId),
    ]);

    return { reviews, total, averageRating, ratingDistribution };
  }
}

