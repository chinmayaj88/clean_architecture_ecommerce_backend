import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { Product } from '../../core/entities/Product';

export class UpdateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, updates: {
    name?: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    price?: number;
    compareAtPrice?: number;
    costPrice?: number;
    status?: 'draft' | 'active' | 'archived';
    isVisible?: boolean;
    stockQuantity?: number;
    stockStatus?: 'in_stock' | 'out_of_stock' | 'backorder';
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    metaTitle?: string;
    metaDescription?: string;
    attributes?: Record<string, any>;
  }): Promise<Product> {
    // Check if product exists
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    // If slug is being updated, check if new slug is available
    if (updates.slug && updates.slug !== existing.slug) {
      const existingBySlug = await this.productRepository.findBySlug(updates.slug);
      if (existingBySlug) {
        throw new Error('Product with this slug already exists');
      }
    }

    // Set publishedAt if status is being changed to active
    const finalUpdates: any = { ...updates };
    if (updates.status === 'active' && existing.status !== 'active') {
      finalUpdates.publishedAt = new Date();
    }

    return await this.productRepository.update(id, finalUpdates as Partial<Product>);
  }
}

