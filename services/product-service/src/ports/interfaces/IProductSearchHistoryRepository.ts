import { ProductSearchHistory } from '../../core/entities/ProductSearchHistory';

export interface CreateProductSearchHistoryData {
  productId?: string | null;
  userId?: string | null;
  query: string;
  filters?: Record<string, any> | null;
  resultsCount?: number | null;
}

export interface IProductSearchHistoryRepository {
  create(data: CreateProductSearchHistoryData): Promise<ProductSearchHistory>;
  findByUserId(userId: string, limit?: number): Promise<ProductSearchHistory[]>;
  findPopularQueries(limit?: number): Promise<Array<{ query: string; count: number }>>;
  findRecentQueries(limit?: number): Promise<ProductSearchHistory[]>;
}

