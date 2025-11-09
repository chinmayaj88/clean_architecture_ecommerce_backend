import { ICategoryRepository } from '../../ports/interfaces/ICategoryRepository';
import { Category } from '../entities/Category';

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(id: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: string | null;
    sortOrder?: number;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<Category> {
    // Check if category exists
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new Error('Category not found');
    }

    // Check if new slug conflicts with another category
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await this.categoryRepository.findBySlug(data.slug);
      if (slugExists) {
        throw new Error('Category with this slug already exists');
      }
    }

    // Validate parent exists if provided
    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }
      const parent = await this.categoryRepository.findById(data.parentId);
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    return await this.categoryRepository.update(id, {
      name: data.name,
      slug: data.slug,
      description: data.description !== undefined ? data.description : undefined,
      parentId: data.parentId,
      sortOrder: data.sortOrder,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
      isActive: data.isActive,
    });
  }
}

