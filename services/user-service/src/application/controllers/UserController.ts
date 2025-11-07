/**
 * User Controller
 * Handles HTTP requests for user profile operations
 */

import { Response } from 'express';
import { GetUserProfileUseCase } from '../../core/use-cases/GetUserProfileUseCase';
import { UpdateUserProfileUseCase } from '../../core/use-cases/UpdateUserProfileUseCase';
import { CreateAddressUseCase } from '../../core/use-cases/CreateAddressUseCase';
import { GetAddressesUseCase } from '../../core/use-cases/GetAddressesUseCase';
import { UpdateAddressUseCase } from '../../core/use-cases/UpdateAddressUseCase';
import { DeleteAddressUseCase } from '../../core/use-cases/DeleteAddressUseCase';
import { CreatePaymentMethodUseCase } from '../../core/use-cases/CreatePaymentMethodUseCase';
import { UpdatePaymentMethodUseCase } from '../../core/use-cases/UpdatePaymentMethodUseCase';
import { DeletePaymentMethodUseCase } from '../../core/use-cases/DeletePaymentMethodUseCase';
import { AddToWishlistUseCase } from '../../core/use-cases/AddToWishlistUseCase';
import { GetWishlistUseCase } from '../../core/use-cases/GetWishlistUseCase';
import { TrackProductViewUseCase } from '../../core/use-cases/TrackProductViewUseCase';
import { GetRecentlyViewedProductsUseCase } from '../../core/use-cases/GetRecentlyViewedProductsUseCase';
import { TrackUserActivityUseCase } from '../../core/use-cases/TrackUserActivityUseCase';
import { GetUserActivityUseCase } from '../../core/use-cases/GetUserActivityUseCase';
import { GetUserActivityStatsUseCase } from '../../core/use-cases/GetUserActivityStatsUseCase';
import { CalculateProfileCompletionScoreUseCase } from '../../core/use-cases/CalculateProfileCompletionScoreUseCase';
import { UpdateNotificationPreferenceUseCase } from '../../core/use-cases/UpdateNotificationPreferenceUseCase';
import { GetNotificationPreferencesUseCase } from '../../core/use-cases/GetNotificationPreferencesUseCase';
import { ExportUserDataUseCase } from '../../core/use-cases/ExportUserDataUseCase';
import { DeleteUserDataUseCase } from '../../core/use-cases/DeleteUserDataUseCase';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
} from '../utils/response.util';
import { IAddressRepository } from '../../ports/interfaces/IAddressRepository';
import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';
import { IWishlistItemRepository } from '../../ports/interfaces/IWishlistItemRepository';

export class UserController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly getAddressesUseCase: GetAddressesUseCase,
    private readonly updateAddressUseCase: UpdateAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
    private readonly createPaymentMethodUseCase: CreatePaymentMethodUseCase,
    private readonly updatePaymentMethodUseCase: UpdatePaymentMethodUseCase,
    private readonly deletePaymentMethodUseCase: DeletePaymentMethodUseCase,
    private readonly addToWishlistUseCase: AddToWishlistUseCase,
    private readonly getWishlistUseCase: GetWishlistUseCase,
    private readonly trackProductViewUseCase: TrackProductViewUseCase,
    private readonly getRecentlyViewedProductsUseCase: GetRecentlyViewedProductsUseCase,
    private readonly trackUserActivityUseCase: TrackUserActivityUseCase,
    private readonly getUserActivityUseCase: GetUserActivityUseCase,
    private readonly getUserActivityStatsUseCase: GetUserActivityStatsUseCase,
    private readonly calculateProfileCompletionScoreUseCase: CalculateProfileCompletionScoreUseCase,
    private readonly updateNotificationPreferenceUseCase: UpdateNotificationPreferenceUseCase,
    private readonly getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase,
    private readonly exportUserDataUseCase: ExportUserDataUseCase,
    private readonly deleteUserDataUseCase: DeleteUserDataUseCase,
    private readonly _addressRepository: IAddressRepository, // Reserved for future use
    private readonly paymentMethodRepository: IPaymentMethodRepository,
    private readonly wishlistItemRepository: IWishlistItemRepository
  ) {
    // Reference to avoid unused variable warning
    void this._addressRepository;
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const profile = await this.getUserProfileUseCase.execute(userId);
      if (!profile) {
        sendNotFound(res, 'User profile not found');
        return;
      }

      sendSuccess(res, 200, 'User profile retrieved successfully', profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user profile';
      sendBadRequest(res, message);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const profile = await this.updateUserProfileUseCase.execute(userId, req.body);
      sendSuccess(res, 200, 'Profile updated successfully', profile);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      sendBadRequest(res, message);
    }
  }

  async createAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const address = await this.createAddressUseCase.execute({
        ...req.body,
        userId,
      });

      sendCreated(res, 'Address created successfully', address);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create address';
      sendBadRequest(res, message);
    }
  }

  async getAddresses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const type = req.query.type as 'shipping' | 'billing' | 'both' | undefined;
      const addresses = await this.getAddressesUseCase.execute(userId, type);

      sendSuccess(res, 200, 'Addresses retrieved successfully', addresses);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get addresses';
      sendBadRequest(res, message);
    }
  }

  async createPaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const paymentMethod = await this.createPaymentMethodUseCase.execute({
        ...req.body,
        userId,
      });

      sendCreated(res, 'Payment method added successfully', paymentMethod);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create payment method';
      sendBadRequest(res, message);
    }
  }

  async getPaymentMethods(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const paymentMethods = await this.paymentMethodRepository.findByUserId(userId);
      sendSuccess(res, 200, 'Payment methods retrieved successfully', paymentMethods);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get payment methods';
      sendBadRequest(res, message);
    }
  }

  async addToWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const wishlistItem = await this.addToWishlistUseCase.execute({
        ...req.body,
        userId,
      });

      sendCreated(res, 'Item added to wishlist successfully', wishlistItem);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add to wishlist';
      sendBadRequest(res, message);
    }
  }

  async getWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const wishlist = await this.getWishlistUseCase.execute(userId);
      sendSuccess(res, 200, 'Wishlist retrieved successfully', wishlist);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get wishlist';
      sendBadRequest(res, message);
    }
  }

  async updateAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const addressId = req.params.addressId;
      if (!addressId) {
        sendBadRequest(res, 'Address ID is required');
        return;
      }

      const address = await this.updateAddressUseCase.execute(addressId, req.body);
      sendSuccess(res, 200, 'Address updated successfully', address);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update address';
      sendBadRequest(res, message);
    }
  }

  async deleteAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const addressId = req.params.addressId;
      if (!addressId) {
        sendBadRequest(res, 'Address ID is required');
        return;
      }

      await this.deleteAddressUseCase.execute(addressId);
      sendSuccess(res, 200, 'Address deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete address';
      sendBadRequest(res, message);
    }
  }

  async updatePaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paymentMethodId = req.params.paymentMethodId;
      if (!paymentMethodId) {
        sendBadRequest(res, 'Payment method ID is required');
        return;
      }

      const paymentMethod = await this.updatePaymentMethodUseCase.execute(paymentMethodId, req.body);
      sendSuccess(res, 200, 'Payment method updated successfully', paymentMethod);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update payment method';
      sendBadRequest(res, message);
    }
  }

  async deletePaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paymentMethodId = req.params.paymentMethodId;
      if (!paymentMethodId) {
        sendBadRequest(res, 'Payment method ID is required');
        return;
      }

      await this.deletePaymentMethodUseCase.execute(paymentMethodId);
      sendSuccess(res, 200, 'Payment method deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete payment method';
      sendBadRequest(res, message);
    }
  }

  async removeFromWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const itemId = req.params.itemId;
      if (!itemId) {
        sendBadRequest(res, 'Item ID is required');
        return;
      }

      await this.wishlistItemRepository.delete(itemId);
      sendSuccess(res, 200, 'Item removed from wishlist successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove from wishlist';
      sendBadRequest(res, message);
    }
  }

  async trackProductView(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const { productId, productName, productImageUrl, productPrice } = req.body;
      if (!productId) {
        sendBadRequest(res, 'Product ID is required');
        return;
      }

      const viewed = await this.trackProductViewUseCase.execute(
        userId,
        productId,
        { productName, productImageUrl, productPrice },
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      sendSuccess(res, 200, 'Product view tracked successfully', viewed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to track product view';
      sendBadRequest(res, message);
    }
  }

  async getRecentlyViewedProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const products = await this.getRecentlyViewedProductsUseCase.execute(userId, limit);

      sendSuccess(res, 200, 'Recently viewed products retrieved successfully', products);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get recently viewed products';
      sendBadRequest(res, message);
    }
  }

  async trackActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const { activityType, entityType, entityId, metadata } = req.body;
      if (!activityType) {
        sendBadRequest(res, 'Activity type is required');
        return;
      }

      const activity = await this.trackUserActivityUseCase.execute({
        userId,
        activityType,
        entityType,
        entityId,
        metadata,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      sendCreated(res, 'Activity tracked successfully', activity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to track activity';
      sendBadRequest(res, message);
    }
  }

  async getActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const activityType = req.query.activityType as string | undefined;
      const entityType = req.query.entityType as string | undefined;

      const result = await this.getUserActivityUseCase.execute(userId, {
        limit,
        offset,
        activityType,
        entityType,
      });

      sendSuccess(res, 200, 'Activity retrieved successfully', result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get activity';
      sendBadRequest(res, message);
    }
  }

  async getActivityStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const stats = await this.getUserActivityStatsUseCase.execute(userId, days);

      sendSuccess(res, 200, 'Activity stats retrieved successfully', stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get activity stats';
      sendBadRequest(res, message);
    }
  }

  async calculateProfileCompletionScore(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const result = await this.calculateProfileCompletionScoreUseCase.execute(userId);
      sendSuccess(res, 200, 'Profile completion score calculated successfully', result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to calculate profile completion score';
      sendBadRequest(res, message);
    }
  }

  async getNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const channel = req.query.channel as string | undefined;
      const preferences = await this.getNotificationPreferencesUseCase.execute(userId, channel);

      sendSuccess(res, 200, 'Notification preferences retrieved successfully', { preferences });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get notification preferences';
      sendBadRequest(res, message);
    }
  }

  async updateNotificationPreference(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      const { channel, category, enabled, frequency } = req.body;
      if (!channel || !category) {
        sendBadRequest(res, 'Channel and category are required');
        return;
      }

      const preference = await this.updateNotificationPreferenceUseCase.execute(userId, {
        userId,
        channel,
        category,
        enabled,
        frequency,
      });

      sendSuccess(res, 200, 'Notification preference updated successfully', preference);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update notification preference';
      sendBadRequest(res, message);
    }
  }

  async exportUserData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      // Verify ownership or admin role
      if (req.user?.userId !== userId && !req.user?.roles?.includes('admin')) {
        sendBadRequest(res, 'Unauthorized');
        return;
      }

      const data = await this.exportUserDataUseCase.execute(userId);

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}-${Date.now()}.json"`);

      sendSuccess(res, 200, 'User data exported successfully', data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export user data';
      sendBadRequest(res, message);
    }
  }

  async deleteUserData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        sendBadRequest(res, 'User ID is required');
        return;
      }

      // Verify ownership or admin role
      if (req.user?.userId !== userId && !req.user?.roles?.includes('admin')) {
        sendBadRequest(res, 'Unauthorized');
        return;
      }

      // Require confirmation
      const { confirm } = req.body;
      if (confirm !== 'DELETE') {
        sendBadRequest(res, 'Confirmation required. Send { "confirm": "DELETE" } to proceed.');
        return;
      }

      await this.deleteUserDataUseCase.execute(userId);

      sendSuccess(res, 200, 'User data deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user data';
      sendBadRequest(res, message);
    }
  }
}

