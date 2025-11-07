/**
 * Export User Data Use Case (GDPR Compliance)
 * Exports all user data in a structured format
 */

import { IUserProfileRepository } from '../../ports/interfaces/IUserProfileRepository';
import { IAddressRepository } from '../../ports/interfaces/IAddressRepository';
import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';
import { IWishlistItemRepository } from '../../ports/interfaces/IWishlistItemRepository';
import { IRecentlyViewedProductRepository } from '../../ports/interfaces/IRecentlyViewedProductRepository';
import { IUserActivityRepository } from '../../ports/interfaces/IUserActivityRepository';
import { INotificationPreferenceRepository } from '../../ports/interfaces/INotificationPreferenceRepository';

export interface UserDataExport {
  profile: any;
  addresses: any[];
  paymentMethods: any[];
  wishlist: any[];
  recentlyViewedProducts: any[];
  activities: any[];
  notificationPreferences: any[];
  exportDate: string;
}

export class ExportUserDataUseCase {
  constructor(
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly paymentMethodRepository: IPaymentMethodRepository,
    private readonly wishlistItemRepository: IWishlistItemRepository,
    private readonly recentlyViewedProductRepository: IRecentlyViewedProductRepository,
    private readonly userActivityRepository: IUserActivityRepository,
    private readonly notificationPreferenceRepository: INotificationPreferenceRepository
  ) {}

  async execute(userId: string): Promise<UserDataExport> {
    const [
      profile,
      addresses,
      paymentMethods,
      wishlist,
      recentlyViewed,
      activities,
      notificationPreferences,
    ] = await Promise.all([
      this.userProfileRepository.findByUserId(userId),
      this.addressRepository.findByUserId(userId),
      this.paymentMethodRepository.findByUserId(userId),
      this.wishlistItemRepository.findByUserId(userId),
      this.recentlyViewedProductRepository.findByUserId(userId),
      this.userActivityRepository.findByUserId(userId, { limit: 1000 }),
      this.notificationPreferenceRepository.findByUserId(userId),
    ]);

    return {
      profile: profile ? this.sanitizeProfile(profile) : null,
      addresses: addresses.map((a) => this.sanitizeAddress(a)),
      paymentMethods: paymentMethods.map((p) => this.sanitizePaymentMethod(p)),
      wishlist: wishlist.map((w) => this.sanitizeWishlistItem(w)),
      recentlyViewedProducts: recentlyViewed.map((r) => this.sanitizeRecentlyViewed(r)),
      activities: activities.map((a) => this.sanitizeActivity(a)),
      notificationPreferences: notificationPreferences.map((n) => this.sanitizeNotificationPreference(n)),
      exportDate: new Date().toISOString(),
    };
  }

  private sanitizeProfile(profile: any): any {
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      preferredCurrency: profile.preferredCurrency,
      preferredLanguage: profile.preferredLanguage,
      newsletterSubscribed: profile.newsletterSubscribed,
      marketingOptIn: profile.marketingOptIn,
      profileCompletionScore: profile.profileCompletionScore,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      lastLoginAt: profile.lastLoginAt,
    };
  }

  private sanitizeAddress(address: any): any {
    return {
      id: address.id,
      type: address.type,
      isDefault: address.isDefault,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }

  private sanitizePaymentMethod(paymentMethod: any): any {
    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      isDefault: paymentMethod.isDefault,
      last4: paymentMethod.last4,
      brand: paymentMethod.brand,
      expiryMonth: paymentMethod.expiryMonth,
      expiryYear: paymentMethod.expiryYear,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt,
    };
  }

  private sanitizeWishlistItem(item: any): any {
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImageUrl: item.productImageUrl,
      productPrice: item.productPrice,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private sanitizeRecentlyViewed(viewed: any): any {
    return {
      id: viewed.id,
      productId: viewed.productId,
      productName: viewed.productName,
      productImageUrl: viewed.productImageUrl,
      productPrice: viewed.productPrice,
      viewedAt: viewed.viewedAt,
    };
  }

  private sanitizeActivity(activity: any): any {
    return {
      id: activity.id,
      activityType: activity.activityType,
      entityType: activity.entityType,
      entityId: activity.entityId,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
    };
  }

  private sanitizeNotificationPreference(pref: any): any {
    return {
      id: pref.id,
      channel: pref.channel,
      category: pref.category,
      enabled: pref.enabled,
      frequency: pref.frequency,
      createdAt: pref.createdAt,
      updatedAt: pref.updatedAt,
    };
  }
}

