/**
 * Recently Viewed Product Entity
 * Tracks products viewed by users
 */

export interface RecentlyViewedProduct {
  id: string;
  userId: string;
  productId: string;
  productName?: string | null;
  productImageUrl?: string | null;
  productPrice?: number | null;
  viewedAt: Date;
}

export interface CreateRecentlyViewedProductData {
  userId: string;
  productId: string;
  productName?: string;
  productImageUrl?: string;
  productPrice?: number;
}

