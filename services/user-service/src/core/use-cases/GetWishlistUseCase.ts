/**
 * Get Wishlist Use Case
 */

import { IWishlistItemRepository } from '../../ports/interfaces/IWishlistItemRepository';
import { WishlistItem } from '../entities/WishlistItem';

export class GetWishlistUseCase {
  constructor(
    private readonly wishlistItemRepository: IWishlistItemRepository
  ) {}

  async execute(userId: string): Promise<WishlistItem[]> {
    return await this.wishlistItemRepository.findByUserId(userId);
  }
}

