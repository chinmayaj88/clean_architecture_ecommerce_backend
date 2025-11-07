/**
 * Add to Wishlist Use Case
 */

import { IWishlistItemRepository } from '../../ports/interfaces/IWishlistItemRepository';
import { CreateWishlistItemData, WishlistItem } from '../entities/WishlistItem';

export class AddToWishlistUseCase {
  constructor(
    private readonly wishlistItemRepository: IWishlistItemRepository
  ) {}

  async execute(data: CreateWishlistItemData): Promise<WishlistItem> {
    return await this.wishlistItemRepository.create(data);
  }
}

