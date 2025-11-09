import { IProductSearchHistoryRepository } from '../../ports/interfaces/IProductSearchHistoryRepository';
import { ProductSearchHistory } from '../entities/ProductSearchHistory';

export class CreateSearchHistoryUseCase {
  constructor(private readonly searchHistoryRepository: IProductSearchHistoryRepository) {}

  async execute(data: {
    productId?: string | null;
    userId?: string | null;
    query: string;
    filters?: Record<string, any> | null;
    resultsCount?: number | null;
  }): Promise<ProductSearchHistory> {
    return await this.searchHistoryRepository.create(data);
  }
}

export class GetSearchHistoryUseCase {
  constructor(private readonly searchHistoryRepository: IProductSearchHistoryRepository) {}

  async executeByUserId(userId: string, limit: number = 50): Promise<ProductSearchHistory[]> {
    return await this.searchHistoryRepository.findByUserId(userId, limit);
  }

  async executePopularQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    return await this.searchHistoryRepository.findPopularQueries(limit);
  }

  async executeRecentQueries(limit: number = 50): Promise<ProductSearchHistory[]> {
    return await this.searchHistoryRepository.findRecentQueries(limit);
  }
}

