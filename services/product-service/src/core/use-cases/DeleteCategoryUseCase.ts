import { ICategoryRepository } from '../../ports/interfaces/ICategoryRepository';

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(id: string): Promise<void> {
    // Check if category exists
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has children
    const children = await this.categoryRepository.findChildren(id);
    if (children.length > 0) {
      throw new Error('Cannot delete category with child categories');
    }

    // Check if category has products
    const productCount = await this.categoryRepository.countProducts(id);
    if (productCount > 0) {
      throw new Error('Cannot delete category with associated products');
    }

    await this.categoryRepository.delete(id);
  }
}

