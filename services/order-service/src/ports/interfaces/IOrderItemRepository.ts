import { OrderItem } from '../../core/entities/OrderItem';

export interface CreateOrderItemData {
  orderId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface IOrderItemRepository {
  create(item: CreateOrderItemData): Promise<OrderItem>;
  createMany(items: CreateOrderItemData[]): Promise<OrderItem[]>;
  findById(id: string): Promise<OrderItem | null>;
  findByOrderId(orderId: string): Promise<OrderItem[]>;
  delete(id: string): Promise<void>;
  deleteByOrderId(orderId: string): Promise<void>;
}

