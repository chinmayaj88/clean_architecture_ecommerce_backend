import { ProductImage } from '../../core/entities/ProductImage';

export interface CreateProductImageData {
  productId: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface UpdateProductImageData {
  url?: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface IProductImageRepository {
  create(data: CreateProductImageData): Promise<ProductImage>;
  findById(id: string): Promise<ProductImage | null>;
  findByProductId(productId: string): Promise<ProductImage[]>;
  findPrimaryByProductId(productId: string): Promise<ProductImage | null>;
  update(id: string, data: UpdateProductImageData): Promise<ProductImage>;
  delete(id: string): Promise<void>;
  setPrimary(id: string, productId: string): Promise<void>;
}

