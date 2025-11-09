import { ProductVariant } from '../../core/entities/ProductVariant';

export interface CreateProductVariantData {
  productId: string;
  sku: string;
  name?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  stockStatus?: string;
  attributes?: Record<string, any> | null;
  imageUrl?: string | null;
}

export interface UpdateProductVariantData {
  name?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  stockStatus?: string;
  attributes?: Record<string, any> | null;
  imageUrl?: string | null;
}

export interface IProductVariantRepository {
  create(data: CreateProductVariantData): Promise<ProductVariant>;
  findById(id: string): Promise<ProductVariant | null>;
  findBySku(sku: string): Promise<ProductVariant | null>;
  findByProductId(productId: string): Promise<ProductVariant[]>;
  update(id: string, data: UpdateProductVariantData): Promise<ProductVariant>;
  delete(id: string): Promise<void>;
}

