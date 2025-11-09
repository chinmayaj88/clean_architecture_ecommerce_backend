import { Category } from '../../core/entities/Category';

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  level?: number;
  sortOrder?: number;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  level?: number;
  sortOrder?: number;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface ICategoryRepository {
  create(data: CreateCategoryData): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(filters?: {
    parentId?: string | null;
    isActive?: boolean;
    level?: number;
  }): Promise<Category[]>;
  findChildren(parentId: string): Promise<Category[]>;
  findRootCategories(): Promise<Category[]>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  delete(id: string): Promise<void>;
  countProducts(categoryId: string): Promise<number>;
}

