import { PrismaClient } from '@prisma/client';
import { PriceHistory } from '../../core/entities/PriceHistory';
import { IPriceHistoryRepository, CreatePriceHistoryData } from '../../ports/interfaces/IPriceHistoryRepository';

export class PrismaPriceHistoryRepository implements IPriceHistoryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePriceHistoryData): Promise<PriceHistory> {
    const history = await this.prisma.priceHistory.create({
      data: {
        productId: data.productId,
        price: data.price,
        compareAtPrice: data.compareAtPrice || null,
        changedBy: data.changedBy || null,
        reason: data.reason || null,
      },
    });

    return this.mapToEntity(history);
  }

  async findByProductId(productId: string, limit: number = 50): Promise<PriceHistory[]> {
    const histories = await this.prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return histories.map((h: any) => this.mapToEntity(h));
  }

  async findLatestByProductId(productId: string): Promise<PriceHistory | null> {
    const history = await this.prisma.priceHistory.findFirst({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    if (!history) {
      return null;
    }

    return this.mapToEntity(history);
  }

  private mapToEntity(history: any): PriceHistory {
    return new PriceHistory(
      history.id,
      history.productId,
      Number(history.price),
      history.compareAtPrice ? Number(history.compareAtPrice) : null,
      history.changedBy,
      history.reason,
      history.createdAt
    );
  }
}

