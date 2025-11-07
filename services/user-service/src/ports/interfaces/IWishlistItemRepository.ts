/**
 * Wishlist Item Repository Interface - Port
 */

import { WishlistItem, CreateWishlistItemData, UpdateWishlistItemData } from '../../core/entities/WishlistItem';

export interface IWishlistItemRepository {
  create(data: CreateWishlistItemData): Promise<WishlistItem>;
  findById(id: string): Promise<WishlistItem | null>;
  findByUserId(userId: string): Promise<WishlistItem[]>;
  findByUserIdAndProductId(userId: string, productId: string): Promise<WishlistItem | null>;
  update(id: string, data: UpdateWishlistItemData): Promise<WishlistItem>;
  delete(id: string): Promise<void>;
  deleteByUserIdAndProductId(userId: string, productId: string): Promise<void>;
  exists(userId: string, productId: string): Promise<boolean>;
}

