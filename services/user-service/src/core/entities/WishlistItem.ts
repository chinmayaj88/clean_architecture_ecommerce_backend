/**
 * Wishlist Item Entity - Core Domain Model
 * Products user wants to buy later
 */

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  productName?: string;
  productImageUrl?: string;
  productPrice?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWishlistItemData {
  userId: string;
  productId: string;
  productName?: string;
  productImageUrl?: string;
  productPrice?: string;
  notes?: string;
}

export interface UpdateWishlistItemData {
  notes?: string;
}

