import { IProductTagRepository } from '../../ports/interfaces/IProductTagRepository';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { ProductTag } from '../entities/ProductTag';

export class CreateProductTagUseCase {
  constructor(
    private readonly tagRepository: IProductTagRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: { productId: string; tag: string }): Promise<ProductTag> {
    // Validate product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await this.tagRepository.create(data);
  }
}

export class GetProductTagUseCase {
  constructor(private readonly tagRepository: IProductTagRepository) {}

  async executeByProductId(productId: string): Promise<ProductTag[]> {
    return await this.tagRepository.findByProductId(productId);
  }
}

export class DeleteProductTagUseCase {
  constructor(private readonly tagRepository: IProductTagRepository) {}

  async execute(id: string): Promise<void> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) {
      throw new Error('Tag not found');
    }

    await this.tagRepository.delete(id);
  }

  async executeByProductIdAndTag(productId: string, tag: string): Promise<void> {
    await this.tagRepository.deleteByProductIdAndTag(productId, tag);
  }
}

