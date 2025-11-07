/**
 * Payment Method Entity - Core Domain Model
 * Represents payment methods (credit cards, PayPal, etc.)
 */

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_account';
  isDefault: boolean;
  cardType?: string; // 'visa', 'mastercard', 'amex', etc.
  last4?: string; // Last 4 digits
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
  billingAddressId?: string;
  providerToken?: string; // Encrypted token
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentMethodData {
  userId: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_account';
  isDefault?: boolean;
  cardType?: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
  billingAddressId?: string;
  providerToken?: string;
}

export interface UpdatePaymentMethodData {
  isDefault?: boolean;
  billingAddressId?: string;
  cardholderName?: string;
}

