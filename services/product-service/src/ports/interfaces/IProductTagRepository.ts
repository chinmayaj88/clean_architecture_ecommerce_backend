import { ProductTag } from '../../core/entities/ProductTag';

export interface CreateProductTagData {
  productId: string;
  tag: string;
}

export interface IProductTagRepository {
  create(data: CreateProductTagData): Promise<ProductTag>;
  findById(id: string): Promise<ProductTag | null>;
  findByProductId(productId: string): Promise<ProductTag[]>;
  findByTag(tag: string): Promise<ProductTag[]>;
  delete(id: string): Promise<void>;
  deleteByProductId(productId: string): Promise<void>;
  deleteByProductIdAndTag(productId: string, tag: string): Promise<void>;
}

