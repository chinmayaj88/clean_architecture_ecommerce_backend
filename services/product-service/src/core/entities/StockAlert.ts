/**
 * Stock Alert Entity
 * Notify users when product is back in stock
 */

export interface StockAlert {
  id: string;
  productId: string;
  userId: string;
  email: string;
  variantId?: string | null;
  notified: boolean;
  notifiedAt?: Date | null;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateStockAlertData {
  productId: string;
  userId: string;
  email: string;
  variantId?: string;
}

