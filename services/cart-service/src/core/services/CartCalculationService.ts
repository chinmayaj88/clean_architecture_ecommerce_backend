import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';

export interface CartCalculationResult {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export class CartCalculationService {
  // Simple tax calculation (can be enhanced with tax service integration)
  private calculateTax(subtotal: number, taxRate: number = 0.1): number {
    return Math.round(subtotal * taxRate * 100) / 100;
  }

  // Simple shipping calculation (can be enhanced with shipping service integration)
  private calculateShipping(subtotal: number, freeShippingThreshold: number = 100): number {
    if (subtotal >= freeShippingThreshold) {
      return 0;
    }
    return 10; // Fixed shipping cost
  }

  // Calculate discount (can be enhanced with discount service integration)
  private calculateDiscount(
    _subtotal: number,
    _couponCode: string | null,
    discountAmount: number = 0
  ): number {
    // For now, just return the existing discount amount
    // In production, this would validate the coupon and calculate discount
    return discountAmount;
  }

  calculateCartTotals(
    items: CartItem[],
    couponCode: string | null = null,
    existingDiscount: number = 0,
    taxRate: number = 0.1,
    freeShippingThreshold: number = 100
  ): CartCalculationResult {
    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Calculate tax
    const taxAmount = this.calculateTax(subtotal, taxRate);

    // Calculate shipping
    const shippingAmount = this.calculateShipping(subtotal, freeShippingThreshold);

    // Calculate discount
    const discountAmount = this.calculateDiscount(subtotal, couponCode, existingDiscount);

    // Calculate total
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      shippingAmount: Math.round(shippingAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  recalculateCart(cart: Cart, items: CartItem[]): CartCalculationResult {
    return this.calculateCartTotals(
      items,
      cart.couponCode,
      cart.discountAmount,
      0.1, // 10% tax rate
      100 // Free shipping over $100
    );
  }
}

