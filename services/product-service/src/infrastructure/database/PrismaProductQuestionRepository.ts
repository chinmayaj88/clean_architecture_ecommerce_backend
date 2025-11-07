/**
 * Prisma Product Question Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IProductQuestionRepository } from '../../ports/interfaces/IProductQuestionRepository';
import { ProductQuestion, CreateProductQuestionData, AnswerProductQuestionData } from '../../core/entities/ProductQuestion';

export class PrismaProductQuestionRepository implements IProductQuestionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateProductQuestionData): Promise<ProductQuestion> {
    const question = await this.prisma.productQuestion.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        question: data.question,
        isApproved: false, // Require moderation
      },
    });

    return this.mapToEntity(question);
  }

  async findById(id: string): Promise<ProductQuestion | null> {
    const question = await this.prisma.productQuestion.findUnique({
      where: { id },
    });

    return question ? this.mapToEntity(question) : null;
  }

  async findByProductId(
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      isApproved?: boolean;
      answered?: boolean;
    }
  ): Promise<ProductQuestion[]> {
    const where: any = { productId };

    if (options?.isApproved !== undefined) {
      where.isApproved = options.isApproved;
    }

    if (options?.answered !== undefined) {
      if (options.answered) {
        where.answer = { not: null };
      } else {
        where.answer = null;
      }
    }

    const questions = await this.prisma.productQuestion.findMany({
      where,
      orderBy: [
        { upvotes: 'desc' },
        { createdAt: 'desc' },
      ],
      take: options?.limit,
      skip: options?.offset,
    });

    return questions.map((q) => this.mapToEntity(q));
  }

  async countByProductId(
    productId: string,
    filters?: {
      isApproved?: boolean;
      answered?: boolean;
    }
  ): Promise<number> {
    const where: any = { productId };

    if (filters?.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }

    if (filters?.answered !== undefined) {
      if (filters.answered) {
        where.answer = { not: null };
      } else {
        where.answer = null;
      }
    }

    return this.prisma.productQuestion.count({ where });
  }

  async answer(id: string, data: AnswerProductQuestionData): Promise<ProductQuestion> {
    const question = await this.prisma.productQuestion.update({
      where: { id },
      data: {
        answer: data.answer,
        answeredBy: data.answeredBy,
        answeredAt: new Date(),
      },
    });

    return this.mapToEntity(question);
  }

  async upvote(id: string): Promise<void> {
    await this.prisma.productQuestion.update({
      where: { id },
      data: {
        upvotes: { increment: 1 },
      },
    });
  }

  async report(id: string): Promise<void> {
    await this.prisma.productQuestion.update({
      where: { id },
      data: {
        reportedCount: { increment: 1 },
      },
    });
  }

  async approve(id: string): Promise<void> {
    await this.prisma.productQuestion.update({
      where: { id },
      data: {
        isApproved: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productQuestion.delete({
      where: { id },
    });
  }

  private mapToEntity(question: any): ProductQuestion {
    return {
      id: question.id,
      productId: question.productId,
      userId: question.userId,
      question: question.question,
      answer: question.answer,
      answeredBy: question.answeredBy,
      answeredAt: question.answeredAt,
      upvotes: question.upvotes,
      isApproved: question.isApproved,
      reportedCount: question.reportedCount,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }
}

