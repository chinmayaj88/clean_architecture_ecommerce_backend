/**
 * Address Entity - Core Domain Model
 * Represents shipping and billing addresses
 */

export interface Address {
  id: string;
  userId: string;
  type: 'shipping' | 'billing' | 'both';
  isDefault: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressData {
  userId: string;
  type: 'shipping' | 'billing' | 'both';
  isDefault?: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface UpdateAddressData {
  type?: 'shipping' | 'billing' | 'both';
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

