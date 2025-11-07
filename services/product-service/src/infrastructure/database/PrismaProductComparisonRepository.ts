/**
 * Prisma Product Comparison Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IProductComparisonRepository } from '../../ports/interfaces/IProductComparisonRepository';
import { ProductComparison, CreateProductComparisonData } from '../../core/entities/ProductComparison';

export class PrismaProductComparisonRepository implements IProductComparisonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateProductComparisonData): Promise<ProductComparison> {
    // Validate max 4 products
    if (data.productIds.length > 4) {
      throw new Error('Maximum 4 products can be compared');
    }

    // Remove duplicates
    const uniqueProductIds = [...new Set(data.productIds)];

    const comparison = await this.prisma.productComparison.create({
      data: {
        userId: data.userId,
        name: data.name,
        productIds: uniqueProductIds,
      },
    });

    return this.mapToEntity(comparison);
  }

  async findById(id: string): Promise<ProductComparison | null> {
    const comparison = await this.prisma.productComparison.findUnique({
      where: { id },
    });

    return comparison ? this.mapToEntity(comparison) : null;
  }

  async findByUserId(userId: string): Promise<ProductComparison[]> {
    const comparisons = await this.prisma.productComparison.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return comparisons.map((c) => this.mapToEntity(c));
  }

  async update(id: string, updates: Partial<ProductComparison>): Promise<ProductComparison> {
    const data: any = {};

    if (updates.name !== undefined) {
      data.name = updates.name;
    }

    if (updates.productIds) {
      if (updates.productIds.length > 4) {
        throw new Error('Maximum 4 products can be compared');
      }
      data.productIds = [...new Set(updates.productIds)];
    }

    const comparison = await this.prisma.productComparison.update({
      where: { id },
      data,
    });

    return this.mapToEntity(comparison);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productComparison.delete({
      where: { id },
    });
  }

  async findByUserAndProducts(userId: string, productIds: string[]): Promise<ProductComparison | null> {
    // Find comparison with exact same product IDs
    const comparisons = await this.prisma.productComparison.findMany({
      where: {
        userId,
        productIds: {
          hasEvery: productIds,
        },
      },
    });

    // Check if productIds match exactly
    for (const comparison of comparisons) {
      const comparisonIds = comparison.productIds.sort();
      const searchIds = [...new Set(productIds)].sort();
      if (comparisonIds.length === searchIds.length && 
          comparisonIds.every((id, idx) => id === searchIds[idx])) {
        return this.mapToEntity(comparison);
      }
    }

    return null;
  }

  private mapToEntity(comparison: any): ProductComparison {
    return {
      id: comparison.id,
      userId: comparison.userId,
      name: comparison.name,
      productIds: comparison.productIds,
      createdAt: comparison.createdAt,
      updatedAt: comparison.updatedAt,
    };
  }
}

