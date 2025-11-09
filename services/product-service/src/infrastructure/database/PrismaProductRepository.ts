import { PrismaClient } from '@prisma/client';
import { Product } from '../../core/entities/Product';
import { IProductRepository } from '../../ports/interfaces/IProductRepository';
import { getCache } from '../cache/RedisCache';

export class PrismaProductRepository implements IProductRepository {
  private cache = getCache();
  private readonly CACHE_TTL = 900; // 15 minutes

  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const product = await this.prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        status: data.status,
        isVisible: data.isVisible,
        stockQuantity: data.stockQuantity,
        stockStatus: data.stockStatus,
        weight: data.weight,
        length: data.length,
        width: data.width,
        height: data.height,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        attributes: data.attributes,
        badges: data.badges,
        viewCount: data.viewCount,
        purchaseCount: data.purchaseCount,
        searchCount: data.searchCount,
        publishedAt: data.publishedAt,
      },
    });

    return this.mapToEntity(product);
  }

  async findById(id: string): Promise<Product | null> {
    // Try cache first
    const cacheKey = `product:${id}`;
    const cached = await this.cache.get<Product>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (product) {
      const entity = this.mapToEntity(product);
      await this.cache.set(cacheKey, entity, this.CACHE_TTL);
      return entity;
    }

    return null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
    });

    return product ? this.mapToEntity(product) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { sku },
    });

    return product ? this.mapToEntity(product) : null;
  }

  async findAll(filters?: {
    status?: string;
    isVisible?: boolean;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.isVisible !== undefined) {
      where.isVisible = filters.isVisible;
    }

    if (filters?.categoryId) {
      where.categories = {
        some: {
          categoryId: filters.categoryId,
        },
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters?.inStock !== undefined) {
      if (filters.inStock) {
        where.stockStatus = 'in_stock';
        where.stockQuantity = { gt: 0 };
      } else {
        // Merge with existing OR conditions if any
        const existingOR = where.OR || [];
        where.OR = [
          ...existingOR,
          { stockStatus: 'out_of_stock' },
          { stockQuantity: { lte: 0 } },
        ];
      }
    }

    if (filters?.badges && filters.badges.length > 0) {
      where.badges = { hasSome: filters.badges };
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'name':
          orderBy = { name: 'asc' };
          break;
        case 'popularity':
          orderBy = { viewCount: 'desc' };
          break;
        case 'rating':
          // Would need to join with reviews table for average rating
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p: any) => this.mapToEntity(p)),
      total,
    };
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.slug && { slug: updates.slug }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.shortDescription !== undefined && { shortDescription: updates.shortDescription }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.compareAtPrice !== undefined && { compareAtPrice: updates.compareAtPrice }),
        ...(updates.costPrice !== undefined && { costPrice: updates.costPrice }),
        ...(updates.status && { status: updates.status }),
        ...(updates.isVisible !== undefined && { isVisible: updates.isVisible }),
        ...(updates.stockQuantity !== undefined && { stockQuantity: updates.stockQuantity }),
        ...(updates.stockStatus && { stockStatus: updates.stockStatus }),
        ...(updates.weight !== undefined && { weight: updates.weight }),
        ...(updates.length !== undefined && { length: updates.length }),
        ...(updates.width !== undefined && { width: updates.width }),
        ...(updates.height !== undefined && { height: updates.height }),
        ...(updates.metaTitle !== undefined && { metaTitle: updates.metaTitle }),
        ...(updates.metaDescription !== undefined && { metaDescription: updates.metaDescription }),
        ...(updates.attributes !== undefined && { attributes: updates.attributes }),
        ...((updates as any).badges !== undefined && { badges: (updates as any).badges }),
        ...(updates.publishedAt !== undefined && { publishedAt: updates.publishedAt }),
      },
    });

    const entity = this.mapToEntity(product);
    
    // Invalidate cache
    await this.cache.del(`product:${id}`);
    await this.cache.delPattern('product:list:*');

    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cache.del(`product:${id}`);
    await this.cache.delPattern('product:list:*');
  }

  async search(
    query: string,
    filters?: {
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      inStock?: boolean;
      badges?: string[];
      sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity' | 'relevance';
      page?: number;
      limit?: number;
    }
  ): Promise<{ products: Product[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isVisible: true,
      status: 'active',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Apply filters
    if (filters?.categoryId) {
      where.categories = {
        some: { categoryId: filters.categoryId },
      };
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters?.inStock !== undefined) {
      if (filters.inStock) {
        where.stockStatus = 'in_stock';
        where.stockQuantity = { gt: 0 };
      }
    }

    if (filters?.badges && filters.badges.length > 0) {
      where.badges = { hasSome: filters.badges };
    }

    // Sort order
    let orderBy: any = { createdAt: 'desc' };
    if (filters?.sortBy === 'relevance') {
      // For relevance, we could use full-text search ranking
      // For now, sort by viewCount (popularity)
      orderBy = { viewCount: 'desc' };
    } else if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'popularity':
          orderBy = { viewCount: 'desc' };
          break;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p: any) => this.mapToEntity(p)),
      total,
    };
  }

  async getRecommendations(productId: string, limit = 10): Promise<Product[]> {
    // Get product to find its category
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { categories: true },
    });

    if (!product) {
      return [];
    }

    // Get products from same category, excluding current product
    const categoryIds = product.categories.map((c: any) => c.categoryId);

    const recommendations = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        isVisible: true,
        status: 'active',
        categories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { purchaseCount: 'desc' },
      ],
      take: limit,
    });

    return recommendations.map((p: any) => this.mapToEntity(p));
  }

  async getRelatedProducts(productId: string, categoryId?: string, limit = 10): Promise<Product[]> {
    const where: any = {
      id: { not: productId },
      isVisible: true,
      status: 'active',
    };

    if (categoryId) {
      where.categories = {
        some: { categoryId },
      };
    }

    const related = await this.prisma.product.findMany({
      where,
      orderBy: [
        { viewCount: 'desc' },
        { purchaseCount: 'desc' },
      ],
      take: limit,
    });

    return related.map((p: any) => this.mapToEntity(p));
  }

  async incrementViewCount(productId: string): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        viewCount: { increment: 1 },
      },
    });

    // Invalidate cache
    await this.cache.del(`product:${productId}`);
  }

  private mapToEntity(product: any): Product {
    return new Product(
      product.id,
      product.sku,
      product.name,
      product.slug,
      product.description,
      product.shortDescription,
      Number(product.price),
      product.compareAtPrice ? Number(product.compareAtPrice) : null,
      product.costPrice ? Number(product.costPrice) : null,
      product.status,
      product.isVisible,
      product.stockQuantity,
      product.stockStatus,
      product.weight ? Number(product.weight) : null,
      product.length ? Number(product.length) : null,
      product.width ? Number(product.width) : null,
      product.height ? Number(product.height) : null,
      product.metaTitle,
      product.metaDescription,
      product.attributes,
      product.badges || [],
      product.viewCount || 0,
      product.purchaseCount || 0,
      product.searchCount || 0,
      product.createdAt,
      product.updatedAt,
      product.publishedAt
    );
  }
}

