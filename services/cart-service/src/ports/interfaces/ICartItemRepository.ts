import { CartItem } from '../../core/entities/CartItem';

export interface CreateCartItemData {
  cartId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  metadata: Record<string, any> | null;
}

export interface UpdateCartItemData {
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  metadata?: Record<string, any> | null;
}

export interface ICartItemRepository {
  create(item: CreateCartItemData): Promise<CartItem>;
  findById(id: string): Promise<CartItem | null>;
  findByCartId(cartId: string): Promise<CartItem[]>;
  findByCartIdAndProductId(cartId: string, productId: string, variantId?: string | null): Promise<CartItem | null>;
  update(id: string, data: UpdateCartItemData): Promise<CartItem>;
  delete(id: string): Promise<void>;
  deleteByCartId(cartId: string): Promise<void>;
  countByCartId(cartId: string): Promise<number>;
}

