import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { IEventPublisher, ProductCreatedEvent } from '../../ports/interfaces/IEventPublisher';
import { Product } from '../../core/entities/Product';

export class CreateProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private eventPublisher?: IEventPublisher
  ) {}

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
    badges?: string[];
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
      badges: data.badges || [],
      viewCount: 0,
      purchaseCount: 0,
      searchCount: 0,
      publishedAt: data.status === 'active' ? new Date() : null,
    });

    // Publish product created event
    if (this.eventPublisher) {
      const event: ProductCreatedEvent = {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        status: product.status,
        timestamp: new Date().toISOString(),
        source: 'product-service',
      };
      this.eventPublisher.publish('product.created', event).catch((error) => {
        console.error('Failed to publish product.created event:', error);
      });
    }

    return product;
  }
}

