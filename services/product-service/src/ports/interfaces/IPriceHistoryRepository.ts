import { PriceHistory } from '../../core/entities/PriceHistory';

export interface CreatePriceHistoryData {
  productId: string;
  price: number;
  compareAtPrice?: number | null;
  changedBy?: string | null;
  reason?: string | null;
}

export interface IPriceHistoryRepository {
  create(data: CreatePriceHistoryData): Promise<PriceHistory>;
  findByProductId(productId: string, limit?: number): Promise<PriceHistory[]>;
  findLatestByProductId(productId: string): Promise<PriceHistory | null>;
}

