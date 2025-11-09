import { ICategoryRepository } from '../../ports/interfaces/ICategoryRepository';
import { Category } from '../entities/Category';

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<Category> {
    // Check if slug already exists
    const existing = await this.categoryRepository.findBySlug(data.slug);
    if (existing) {
      throw new Error('Category with this slug already exists');
    }

    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await this.categoryRepository.findById(data.parentId);
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    return await this.categoryRepository.create({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder ?? 0,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive ?? true,
    });
  }
}

