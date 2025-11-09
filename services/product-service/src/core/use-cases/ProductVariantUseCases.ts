import { IProductVariantRepository } from '../../ports/interfaces/IProductVariantRepository';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { ProductVariant } from '../entities/ProductVariant';

export class CreateProductVariantUseCase {
  constructor(
    private readonly variantRepository: IProductVariantRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: {
    productId: string;
    sku: string;
    name?: string;
    price?: number;
    compareAtPrice?: number;
    stockQuantity?: number;
    stockStatus?: string;
    attributes?: Record<string, any>;
    imageUrl?: string;
  }): Promise<ProductVariant> {
    // Validate product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if SKU already exists
    const existing = await this.variantRepository.findBySku(data.sku);
    if (existing) {
      throw new Error('Variant with this SKU already exists');
    }

    return await this.variantRepository.create(data);
  }
}

export class GetProductVariantUseCase {
  constructor(private readonly variantRepository: IProductVariantRepository) {}

  async execute(id: string): Promise<ProductVariant> {
    const variant = await this.variantRepository.findById(id);
    if (!variant) {
      throw new Error('Variant not found');
    }
    return variant;
  }

  async executeByProductId(productId: string): Promise<ProductVariant[]> {
    return await this.variantRepository.findByProductId(productId);
  }
}

export class UpdateProductVariantUseCase {
  constructor(private readonly variantRepository: IProductVariantRepository) {}

  async execute(id: string, data: Partial<ProductVariant>): Promise<ProductVariant> {
    const variant = await this.variantRepository.findById(id);
    if (!variant) {
      throw new Error('Variant not found');
    }

    return await this.variantRepository.update(id, data);
  }
}

export class DeleteProductVariantUseCase {
  constructor(private readonly variantRepository: IProductVariantRepository) {}

  async execute(id: string): Promise<void> {
    const variant = await this.variantRepository.findById(id);
    if (!variant) {
      throw new Error('Variant not found');
    }

    await this.variantRepository.delete(id);
  }
}

