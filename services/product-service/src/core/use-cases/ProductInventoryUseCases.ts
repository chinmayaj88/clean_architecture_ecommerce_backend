import { IProductInventoryRepository } from '../../ports/interfaces/IProductInventoryRepository';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { ProductInventory } from '../entities/ProductInventory';

export class CreateProductInventoryUseCase {
  constructor(
    private readonly inventoryRepository: IProductInventoryRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: {
    productId: string;
    variantId?: string | null;
    quantity?: number;
    reservedQuantity?: number;
    location?: string;
  }): Promise<ProductInventory> {
    // Validate product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if inventory already exists
    const existing = await this.inventoryRepository.findByProductIdAndVariantId(
      data.productId,
      data.variantId || null
    );
    if (existing) {
      throw new Error('Inventory already exists for this product/variant');
    }

    return await this.inventoryRepository.create(data);
  }
}

export class GetProductInventoryUseCase {
  constructor(private readonly inventoryRepository: IProductInventoryRepository) {}

  async execute(productId: string, variantId?: string | null): Promise<ProductInventory | null> {
    return await this.inventoryRepository.findByProductIdAndVariantId(productId, variantId || null);
  }
}

export class ReserveInventoryUseCase {
  constructor(private readonly inventoryRepository: IProductInventoryRepository) {}

  async execute(productId: string, variantId: string | null, quantity: number): Promise<ProductInventory> {
    return await this.inventoryRepository.reserve(productId, variantId, quantity);
  }
}

export class ReleaseInventoryUseCase {
  constructor(private readonly inventoryRepository: IProductInventoryRepository) {}

  async execute(productId: string, variantId: string | null, quantity: number): Promise<ProductInventory> {
    return await this.inventoryRepository.release(productId, variantId, quantity);
  }
}

export class AdjustInventoryUseCase {
  constructor(private readonly inventoryRepository: IProductInventoryRepository) {}

  async execute(
    productId: string,
    variantId: string | null,
    quantity: number,
    reason?: string
  ): Promise<ProductInventory> {
    return await this.inventoryRepository.adjust(productId, variantId, quantity, reason);
  }
}

