import { ProductInventory } from '../../core/entities/ProductInventory';

export interface CreateProductInventoryData {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  reservedQuantity?: number;
  location?: string | null;
}

export interface UpdateProductInventoryData {
  quantity?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  location?: string | null;
  lastRestockedAt?: Date | null;
}

export interface IProductInventoryRepository {
  create(data: CreateProductInventoryData): Promise<ProductInventory>;
  findById(id: string): Promise<ProductInventory | null>;
  findByProductId(productId: string): Promise<ProductInventory | null>;
  findByProductIdAndVariantId(productId: string, variantId: string | null): Promise<ProductInventory | null>;
  update(id: string, data: UpdateProductInventoryData): Promise<ProductInventory>;
  reserve(productId: string, variantId: string | null, quantity: number): Promise<ProductInventory>;
  release(productId: string, variantId: string | null, quantity: number): Promise<ProductInventory>;
  adjust(productId: string, variantId: string | null, quantity: number, reason?: string): Promise<ProductInventory>;
  delete(id: string): Promise<void>;
}

