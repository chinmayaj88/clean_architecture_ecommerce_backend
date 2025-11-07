/**
 * Create Stock Alert Use Case
 */

import { IStockAlertRepository } from '../../ports/interfaces/IStockAlertRepository';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { StockAlert, CreateStockAlertData } from '../../core/entities/StockAlert';

export class CreateStockAlertUseCase {
  constructor(
    private readonly stockAlertRepository: IStockAlertRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(data: CreateStockAlertData): Promise<StockAlert> {
    // Verify product exists
    const product = await this.productRepository.findById(data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if product is already in stock
    if (product.stockStatus === 'in_stock' && product.stockQuantity > 0) {
      throw new Error('Product is already in stock');
    }

    // Check if alert already exists
    const existingAlerts = await this.stockAlertRepository.findByProductId(
      data.productId,
      data.variantId
    );
    const userAlert = existingAlerts.find((a) => a.userId === data.userId && !a.notified);
    if (userAlert) {
      throw new Error('Stock alert already exists for this product');
    }

    return this.stockAlertRepository.create(data);
  }
}

