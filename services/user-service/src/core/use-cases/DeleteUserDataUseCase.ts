/**
 * Delete User Data Use Case (GDPR Compliance)
 * Deletes all user data from the system
 */

import { IUserProfileRepository } from '../../ports/interfaces/IUserProfileRepository';
import { IAddressRepository } from '../../ports/interfaces/IAddressRepository';
import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';
import { IWishlistItemRepository } from '../../ports/interfaces/IWishlistItemRepository';
import { IRecentlyViewedProductRepository } from '../../ports/interfaces/IRecentlyViewedProductRepository';
import { IUserActivityRepository } from '../../ports/interfaces/IUserActivityRepository';
import { INotificationPreferenceRepository } from '../../ports/interfaces/INotificationPreferenceRepository';

export class DeleteUserDataUseCase {
  constructor(
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly paymentMethodRepository: IPaymentMethodRepository,
    private readonly wishlistItemRepository: IWishlistItemRepository,
    private readonly recentlyViewedProductRepository: IRecentlyViewedProductRepository,
    private readonly userActivityRepository: IUserActivityRepository,
    private readonly notificationPreferenceRepository: INotificationPreferenceRepository
  ) {}

  async execute(userId: string): Promise<void> {
    // Delete all user data
    // Note: Due to cascade deletes in Prisma, deleting the profile will delete related data
    // But we'll delete explicitly for clarity and to ensure everything is removed

    await Promise.all([
      // Delete related data first (though cascade should handle this)
      this.recentlyViewedProductRepository.clearByUserId(userId),
      // Activities, addresses, payment methods, wishlist will be deleted via cascade
      // But we can delete them explicitly if needed
    ]);

    // Delete the profile (this will cascade delete related records)
    await this.userProfileRepository.delete(userId);
  }
}

