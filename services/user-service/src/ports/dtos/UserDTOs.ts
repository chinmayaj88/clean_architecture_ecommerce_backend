/**
 * User Service DTOs
 * Data Transfer Objects for request/response validation
 */

import { z } from 'zod';

// User Profile DTOs
export const UpdateUserProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  avatarUrl: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  preferredCurrency: z.string().length(3).optional(),
  preferredLanguage: z.string().length(2).optional(),
  newsletterSubscribed: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
});

export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;

// Address DTOs
export const CreateAddressSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']),
  isDefault: z.boolean().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(200).optional(),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(2).max(2), // ISO country code
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

export type CreateAddressRequest = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = CreateAddressSchema.partial();
export type UpdateAddressRequest = z.infer<typeof UpdateAddressSchema>;

// Payment Method DTOs
export const CreatePaymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_account']),
  isDefault: z.boolean().optional(),
  cardType: z.string().optional(),
  last4: z.string().length(4).optional(),
  expiryMonth: z.string().length(2).optional(),
  expiryYear: z.string().length(4).optional(),
  cardholderName: z.string().max(100).optional(),
  billingAddressId: z.string().optional(),
  providerToken: z.string().optional(),
});

export type CreatePaymentMethodRequest = z.infer<typeof CreatePaymentMethodSchema>;

// Wishlist DTOs
export const CreateWishlistItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().optional(),
  productImageUrl: z.string().url().optional(),
  productPrice: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateWishlistItemRequest = z.infer<typeof CreateWishlistItemSchema>;

// Preference DTOs
export const CreatePreferenceSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(1000),
});

export type CreatePreferenceRequest = z.infer<typeof CreatePreferenceSchema>;

