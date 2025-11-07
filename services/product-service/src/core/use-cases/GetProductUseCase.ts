import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { Product } from '../../core/entities/Product';

export class GetProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }
}

