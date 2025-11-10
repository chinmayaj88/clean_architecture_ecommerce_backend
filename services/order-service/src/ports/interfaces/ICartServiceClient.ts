export interface CartInfo {
  id: string;
  userId: string | null;
  items: CartItemInfo[];
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

export interface CartItemInfo {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface ICartServiceClient {
  getCart(cartId: string, token?: string): Promise<CartInfo | null>;
  getCartByUserId(userId: string, token?: string): Promise<CartInfo | null>;
  markCartAsConverted(cartId: string, orderId: string, token?: string): Promise<void>;
}

