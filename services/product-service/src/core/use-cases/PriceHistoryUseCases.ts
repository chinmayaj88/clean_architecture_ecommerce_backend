import { IPriceHistoryRepository } from '../../ports/interfaces/IPriceHistoryRepository';
import { PriceHistory } from '../entities/PriceHistory';

export class GetPriceHistoryUseCase {
  constructor(private readonly priceHistoryRepository: IPriceHistoryRepository) {}

  async execute(productId: string, limit: number = 50): Promise<PriceHistory[]> {
    return await this.priceHistoryRepository.findByProductId(productId, limit);
  }

  async executeLatest(productId: string): Promise<PriceHistory | null> {
    return await this.priceHistoryRepository.findLatestByProductId(productId);
  }
}

export class CreatePriceHistoryUseCase {
  constructor(private readonly priceHistoryRepository: IPriceHistoryRepository) {}

  async execute(data: {
    productId: string;
    price: number;
    compareAtPrice?: number | null;
    changedBy?: string | null;
    reason?: string | null;
  }): Promise<PriceHistory> {
    return await this.priceHistoryRepository.create(data);
  }
}

