import { PrismaClient } from '@prisma/client';
import { ProductTag } from '../../core/entities/ProductTag';
import { IProductTagRepository, CreateProductTagData } from '../../ports/interfaces/IProductTagRepository';

export class PrismaProductTagRepository implements IProductTagRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateProductTagData): Promise<ProductTag> {
    // Check if tag already exists for this product
    const existing = await this.prisma.productTag.findFirst({
      where: { productId: data.productId, tag: data.tag },
    });

    if (existing) {
      return this.mapToEntity(existing);
    }

    const tag = await this.prisma.productTag.create({
      data: {
        productId: data.productId,
        tag: data.tag,
      },
    });

    return this.mapToEntity(tag);
  }

  async findById(id: string): Promise<ProductTag | null> {
    const tag = await this.prisma.productTag.findUnique({
      where: { id },
    });

    if (!tag) {
      return null;
    }

    return this.mapToEntity(tag);
  }

  async findByProductId(productId: string): Promise<ProductTag[]> {
    const tags = await this.prisma.productTag.findMany({
      where: { productId },
      orderBy: { tag: 'asc' },
    });

    return tags.map((t: any) => this.mapToEntity(t));
  }

  async findByTag(tag: string): Promise<ProductTag[]> {
    const tags = await this.prisma.productTag.findMany({
      where: { tag },
      orderBy: { createdAt: 'desc' },
    });

    return tags.map((t: any) => this.mapToEntity(t));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productTag.delete({
      where: { id },
    });
  }

  async deleteByProductId(productId: string): Promise<void> {
    await this.prisma.productTag.deleteMany({
      where: { productId },
    });
  }

  async deleteByProductIdAndTag(productId: string, tag: string): Promise<void> {
    await this.prisma.productTag.deleteMany({
      where: { productId, tag },
    });
  }

  private mapToEntity(tag: any): ProductTag {
    return new ProductTag(
      tag.id,
      tag.productId,
      tag.tag,
      tag.createdAt
    );
  }
}

