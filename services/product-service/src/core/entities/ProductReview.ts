/**
 * Product Review Entity
 */

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  rating: number; // 1-5
  title?: string | null;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductReviewData {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase?: boolean;
}

