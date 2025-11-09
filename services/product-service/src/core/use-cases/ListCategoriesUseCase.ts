import { ICategoryRepository } from '../../ports/interfaces/ICategoryRepository';
import { Category } from '../entities/Category';

export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(filters?: {
    parentId?: string | null;
    isActive?: boolean;
    level?: number;
    rootOnly?: boolean;
  }): Promise<Category[]> {
    if (filters?.rootOnly) {
      return await this.categoryRepository.findRootCategories();
    }

    if (filters?.parentId) {
      return await this.categoryRepository.findChildren(filters.parentId);
    }

    return await this.categoryRepository.findAll({
      parentId: filters?.parentId,
      isActive: filters?.isActive,
      level: filters?.level,
    });
  }
}

