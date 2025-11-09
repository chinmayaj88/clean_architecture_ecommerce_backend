import { IProductImageRepository } from '../../ports/interfaces/IProductImageRepository';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { ProductImage } from '../entities/ProductImage';

export class CreateProductImageUseCase {
  constructor(
    private readonly imageRepository: IProductImageRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: {
    productId: string;
    url: string;
    altText?: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }): Promise<ProductImage> {
    // Validate product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return await this.imageRepository.create(data);
  }
}

export class GetProductImageUseCase {
  constructor(private readonly imageRepository: IProductImageRepository) {}

  async execute(id: string): Promise<ProductImage> {
    const image = await this.imageRepository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }
    return image;
  }

  async executeByProductId(productId: string): Promise<ProductImage[]> {
    return await this.imageRepository.findByProductId(productId);
  }
}

export class UpdateProductImageUseCase {
  constructor(private readonly imageRepository: IProductImageRepository) {}

  async execute(id: string, data: Partial<ProductImage>): Promise<ProductImage> {
    const image = await this.imageRepository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }

    return await this.imageRepository.update(id, data);
  }
}

export class DeleteProductImageUseCase {
  constructor(private readonly imageRepository: IProductImageRepository) {}

  async execute(id: string): Promise<void> {
    const image = await this.imageRepository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }

    await this.imageRepository.delete(id);
  }
}

export class SetPrimaryImageUseCase {
  constructor(private readonly imageRepository: IProductImageRepository) {}

  async execute(id: string, productId: string): Promise<void> {
    const image = await this.imageRepository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }

    await this.imageRepository.setPrimary(id, productId);
  }
}

