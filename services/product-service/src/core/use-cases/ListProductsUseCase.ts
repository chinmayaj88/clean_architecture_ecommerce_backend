import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { Product } from '../../core/entities/Product';

export class ListProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(filters?: {
    status?: string;
    isVisible?: boolean;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const result = await this.productRepository.findAll({
      ...filters,
      page,
      limit,
    });

    return {
      products: result.products,
      total: result.total,
      page,
      limit,
    };
  }
}

