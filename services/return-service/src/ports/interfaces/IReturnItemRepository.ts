import { ReturnItem } from '../../core/entities/ReturnItem';

export interface CreateReturnItemData {
  returnRequestId: string;
  orderItemId: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  returnReason?: string | null;
  condition: string;
}

export interface IReturnItemRepository {
  create(data: CreateReturnItemData): Promise<ReturnItem>;
  findById(id: string): Promise<ReturnItem | null>;
  findByReturnRequestId(returnRequestId: string): Promise<ReturnItem[]>;
  update(id: string, data: Partial<CreateReturnItemData>): Promise<ReturnItem>;
  delete(id: string): Promise<void>;
}

