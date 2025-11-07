/**
 * Prisma Product Review Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IProductReviewRepository } from '../../ports/interfaces/IProductReviewRepository';
import { ProductReview, CreateProductReviewData } from '../../core/entities/ProductReview';

export class PrismaProductReviewRepository implements IProductReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateProductReviewData): Promise<ProductReview> {
    const review = await this.prisma.productReview.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        isVerifiedPurchase: data.isVerifiedPurchase ?? false,
        isApproved: false, // Require moderation
      },
    });

    return this.mapToEntity(review);
  }

  async findById(id: string): Promise<ProductReview | null> {
    const review = await this.prisma.productReview.findUnique({
      where: { id },
    });

    return review ? this.mapToEntity(review) : null;
  }

  async findByProductId(
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      isApproved?: boolean;
      rating?: number;
      sortBy?: 'newest' | 'oldest' | 'rating' | 'helpful';
    }
  ): Promise<ProductReview[]> {
    const where: any = { productId };

    if (options?.isApproved !== undefined) {
      where.isApproved = options.isApproved;
    }

    if (options?.rating) {
      where.rating = options.rating;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'rating':
          orderBy = { rating: 'desc' };
          break;
        case 'helpful':
          orderBy = { helpfulCount: 'desc' };
          break;
      }
    }

    const reviews = await this.prisma.productReview.findMany({
      where,
      orderBy,
      take: options?.limit,
      skip: options?.offset,
    });

    return reviews.map((r) => this.mapToEntity(r));
  }

  async countByProductId(
    productId: string,
    filters?: {
      isApproved?: boolean;
      rating?: number;
    }
  ): Promise<number> {
    const where: any = { productId };

    if (filters?.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }

    if (filters?.rating) {
      where.rating = filters.rating;
    }

    return this.prisma.productReview.count({ where });
  }

  async getAverageRating(productId: string): Promise<number> {
    const result = await this.prisma.productReview.aggregate({
      where: {
        productId,
        isApproved: true,
      },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating ? Number(result._avg.rating) : 0;
  }

  async getRatingDistribution(productId: string): Promise<Record<number, number>> {
    const reviews = await this.prisma.productReview.findMany({
      where: {
        productId,
        isApproved: true,
      },
      select: {
        rating: true,
      },
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return distribution;
  }

  async approve(id: string): Promise<void> {
    await this.prisma.productReview.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async reject(id: string): Promise<void> {
    await this.prisma.productReview.delete({
      where: { id },
    });
  }

  async markHelpful(id: string): Promise<void> {
    await this.prisma.productReview.update({
      where: { id },
      data: {
        helpfulCount: { increment: 1 },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productReview.delete({
      where: { id },
    });
  }

  async findPendingReviews(limit = 50): Promise<ProductReview[]> {
    const reviews = await this.prisma.productReview.findMany({
      where: {
        isApproved: false,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return reviews.map((r) => this.mapToEntity(r));
  }

  private mapToEntity(review: any): ProductReview {
    return {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      isApproved: review.isApproved,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}

