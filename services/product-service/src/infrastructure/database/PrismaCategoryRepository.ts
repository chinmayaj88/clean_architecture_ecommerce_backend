import { PrismaClient } from '@prisma/client';
import { Category } from '../../core/entities/Category';
import { ICategoryRepository, CreateCategoryData, UpdateCategoryData } from '../../ports/interfaces/ICategoryRepository';
import { getCache } from '../cache/RedisCache';

export class PrismaCategoryRepository implements ICategoryRepository {
  private cache = getCache();
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(private prisma: PrismaClient) {}

  async create(data: CreateCategoryData): Promise<Category> {
    // Calculate level if parentId is provided
    let level = data.level ?? 0;
    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (parent) {
        level = parent.level + 1;
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        parentId: data.parentId || null,
        level,
        sortOrder: data.sortOrder ?? 0,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive ?? true,
      },
    });

    const entity = this.mapToEntity(category);
    await this.invalidateCache();
    return entity;
  }

  async findById(id: string): Promise<Category | null> {
    const cacheKey = `category:${id}`;
    const cached = await this.cache.get<Category>(cacheKey);
    if (cached) {
      return cached;
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return null;
    }

    const entity = this.mapToEntity(category);
    await this.cache.set(cacheKey, entity, this.CACHE_TTL);
    return entity;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const cacheKey = `category:slug:${slug}`;
    const cached = await this.cache.get<Category>(cacheKey);
    if (cached) {
      return cached;
    }

    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      return null;
    }

    const entity = this.mapToEntity(category);
    await this.cache.set(cacheKey, entity, this.CACHE_TTL);
    return entity;
  }

  async findAll(filters?: {
    parentId?: string | null;
    isActive?: boolean;
    level?: number;
  }): Promise<Category[]> {
    const where: any = {};

    if (filters?.parentId !== undefined) {
      where.parentId = filters.parentId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.level !== undefined) {
      where.level = filters.level;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map((cat: any) => this.mapToEntity(cat));
  }

  async findChildren(parentId: string): Promise<Category[]> {
    const cacheKey = `category:children:${parentId}`;
    const cached = await this.cache.get<Category[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      where: { parentId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const entities = categories.map((cat: any) => this.mapToEntity(cat));
    await this.cache.set(cacheKey, entities, this.CACHE_TTL);
    return entities;
  }

  async findRootCategories(): Promise<Category[]> {
    const cacheKey = 'categories:root';
    const cached = await this.cache.get<Category[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const entities = categories.map((cat: any) => this.mapToEntity(cat));
    await this.cache.set(cacheKey, entities, this.CACHE_TTL);
    return entities;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    // Recalculate level if parentId is being updated
    let level = data.level;
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        });
        if (parent) {
          level = parent.level + 1;
        }
      } else {
        level = 0;
      }
    }

    const updateData: any = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
      ...(level !== undefined && { level }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    const category = await this.prisma.category.update({
      where: { id },
      data: updateData,
    });

    const entity = this.mapToEntity(category);
    await this.invalidateCache();
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
    await this.invalidateCache();
  }

  async countProducts(categoryId: string): Promise<number> {
    return await this.prisma.productCategory.count({
      where: { categoryId },
    });
  }

  private mapToEntity(category: any): Category {
    return new Category(
      category.id,
      category.name,
      category.slug,
      category.description,
      category.parentId,
      category.level,
      category.sortOrder,
      category.imageUrl,
      category.isActive,
      category.createdAt,
      category.updatedAt
    );
  }

  private async invalidateCache(): Promise<void> {
    await this.cache.delPattern('category:*');
    await this.cache.delPattern('categories:*');
  }
}

