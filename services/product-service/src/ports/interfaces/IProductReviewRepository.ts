/**
 * Product Review Repository Interface
 */

import { ProductReview, CreateProductReviewData } from '../../core/entities/ProductReview';

export interface IProductReviewRepository {
  /**
   * Create a review
   */
  create(data: CreateProductReviewData): Promise<ProductReview>;

  /**
   * Find review by ID
   */
  findById(id: string): Promise<ProductReview | null>;

  /**
   * Find reviews for a product
   */
  findByProductId(
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      isApproved?: boolean;
      rating?: number;
      sortBy?: 'newest' | 'oldest' | 'rating' | 'helpful';
    }
  ): Promise<ProductReview[]>;

  /**
   * Count reviews for a product
   */
  countByProductId(
    productId: string,
    filters?: {
      isApproved?: boolean;
      rating?: number;
    }
  ): Promise<number>;

  /**
   * Get average rating for a product
   */
  getAverageRating(productId: string): Promise<number>;

  /**
   * Get rating distribution
   */
  getRatingDistribution(productId: string): Promise<Record<number, number>>;

  /**
   * Approve review
   */
  approve(id: string): Promise<void>;

  /**
   * Reject review
   */
  reject(id: string): Promise<void>;

  /**
   * Mark review as helpful
   */
  markHelpful(id: string): Promise<void>;

  /**
   * Delete review
   */
  delete(id: string): Promise<void>;

  /**
   * Find pending reviews (for moderation)
   */
  findPendingReviews(limit?: number): Promise<ProductReview[]>;
}

