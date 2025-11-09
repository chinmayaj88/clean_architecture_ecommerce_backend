import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { IPriceHistoryRepository } from '../../ports/interfaces/IPriceHistoryRepository';
import { IEventPublisher, ProductUpdatedEvent, ProductPriceChangedEvent, ProductStockChangedEvent } from '../../ports/interfaces/IEventPublisher';
import { Product } from '../../core/entities/Product';

export class UpdateProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private priceHistoryRepository?: IPriceHistoryRepository,
    private eventPublisher?: IEventPublisher
  ) {}

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

    // Track price changes in price history
    if ((updates.price !== undefined && updates.price !== existing.price) ||
        (updates.compareAtPrice !== undefined && updates.compareAtPrice !== existing.compareAtPrice)) {
      if (this.priceHistoryRepository) {
        await this.priceHistoryRepository.create({
          productId: id,
          price: updates.price ?? existing.price,
          compareAtPrice: updates.compareAtPrice !== undefined ? updates.compareAtPrice : existing.compareAtPrice,
          changedBy: null, // Could be passed from auth context
          reason: 'Price update',
        });
      }

      // Publish price changed event
      if (this.eventPublisher && updates.price !== undefined && updates.price !== existing.price) {
        const event: ProductPriceChangedEvent = {
          productId: id,
          sku: existing.sku,
          oldPrice: existing.price,
          newPrice: updates.price,
          timestamp: new Date().toISOString(),
          source: 'product-service',
        };
        this.eventPublisher.publish('product.price.changed', event).catch((error) => {
          console.error('Failed to publish product.price.changed event:', error);
        });
      }
    }

    // Publish stock changed event
    if (this.eventPublisher && updates.stockQuantity !== undefined && updates.stockQuantity !== existing.stockQuantity) {
      const event: ProductStockChangedEvent = {
        productId: id,
        sku: existing.sku,
        oldStock: existing.stockQuantity,
        newStock: updates.stockQuantity,
        timestamp: new Date().toISOString(),
        source: 'product-service',
      };
      this.eventPublisher.publish('product.stock.changed', event).catch((error) => {
        console.error('Failed to publish product.stock.changed event:', error);
      });
    }

    const updatedProduct = await this.productRepository.update(id, finalUpdates as Partial<Product>);

    // Publish product updated event
    if (this.eventPublisher) {
      const event: ProductUpdatedEvent = {
        productId: id,
        sku: existing.sku,
        name: updates.name,
        price: updates.price,
        status: updates.status,
        timestamp: new Date().toISOString(),
        source: 'product-service',
      };
      this.eventPublisher.publish('product.updated', event).catch((error) => {
        console.error('Failed to publish product.updated event:', error);
      });
    }

    return updatedProduct;
  }
}

