import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { Product } from '../../core/entities/Product';

export class CreateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(data: {
    sku: string;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    price: number;
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
    // Check if SKU already exists
    const existingBySku = await this.productRepository.findBySku(data.sku);
    if (existingBySku) {
      throw new Error('Product with this SKU already exists');
    }

    // Check if slug already exists
    const existingBySlug = await this.productRepository.findBySlug(data.slug);
    if (existingBySlug) {
      throw new Error('Product with this slug already exists');
    }

    const product = await this.productRepository.create({
      sku: data.sku,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      price: data.price,
      compareAtPrice: data.compareAtPrice || null,
      costPrice: data.costPrice || null,
      status: data.status || 'draft',
      isVisible: data.isVisible !== undefined ? data.isVisible : true,
      stockQuantity: data.stockQuantity || 0,
      stockStatus: data.stockStatus || 'out_of_stock',
      weight: data.weight || null,
      length: data.length || null,
      width: data.width || null,
      height: data.height || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      attributes: data.attributes || null,
      publishedAt: data.status === 'active' ? new Date() : null,
    });

    return product;
  }
}

