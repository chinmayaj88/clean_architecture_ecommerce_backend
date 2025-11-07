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
}

