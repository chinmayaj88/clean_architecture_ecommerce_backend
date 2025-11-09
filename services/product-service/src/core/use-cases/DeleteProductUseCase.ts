import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { IEventPublisher, ProductDeletedEvent } from '../../ports/interfaces/IEventPublisher';

export class DeleteProductUseCase {
  constructor(
    private productRepository: IProductRepository,
    private eventPublisher?: IEventPublisher
  ) {}

  async execute(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    await this.productRepository.delete(id);

    // Publish product deleted event
    if (this.eventPublisher) {
      const event: ProductDeletedEvent = {
        productId: id,
        sku: product.sku,
        timestamp: new Date().toISOString(),
        source: 'product-service',
      };
      this.eventPublisher.publish('product.deleted', event).catch((error) => {
        console.error('Failed to publish product.deleted event:', error);
      });
    }
  }
}

