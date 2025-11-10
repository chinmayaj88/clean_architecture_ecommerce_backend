import { PrismaClient } from '@prisma/client';
import { IOrderStatusHistoryRepository, CreateOrderStatusHistoryData } from '../../ports/interfaces/IOrderStatusHistoryRepository';
import { OrderStatusHistory } from '../../core/entities/OrderStatusHistory';

export class PrismaOrderStatusHistoryRepository implements IOrderStatusHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(history: CreateOrderStatusHistoryData): Promise<OrderStatusHistory> {
    const created = await this.prisma.orderStatusHistory.create({
      data: {
        orderId: history.orderId,
        status: history.status,
        previousStatus: history.previousStatus,
        changedBy: history.changedBy,
        reason: history.reason,
      },
    });

    return OrderStatusHistory.fromPrisma(created);
  }

  async findByOrderId(orderId: string): Promise<OrderStatusHistory[]> {
    const history = await this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return history.map((h: any) => OrderStatusHistory.fromPrisma(h));
  }

  async findLatestByOrderId(orderId: string): Promise<OrderStatusHistory | null> {
    const history = await this.prisma.orderStatusHistory.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (!history) {
      return null;
    }

    return OrderStatusHistory.fromPrisma(history);
  }
}

