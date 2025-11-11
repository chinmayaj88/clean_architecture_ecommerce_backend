import { PrismaClient } from '@prisma/client';
import { IReturnStatusHistoryRepository, CreateStatusHistoryData } from '../../ports/interfaces/IReturnStatusHistoryRepository';
import { ReturnStatusHistory } from '../../core/entities/ReturnStatusHistory';

export class PrismaReturnStatusHistoryRepository implements IReturnStatusHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateStatusHistoryData): Promise<ReturnStatusHistory> {
    const created = await (this.prisma as any).returnStatusHistory.create({
      data: {
        returnRequestId: data.returnRequestId,
        status: data.status,
        previousStatus: data.previousStatus || null,
        changedBy: data.changedBy,
        notes: data.notes || null,
      },
    });

    return ReturnStatusHistory.fromPrisma(created);
  }

  async findByReturnRequestId(returnRequestId: string): Promise<ReturnStatusHistory[]> {
    const history = await (this.prisma as any).returnStatusHistory.findMany({
      where: { returnRequestId },
      orderBy: { createdAt: 'asc' },
    });

    return history.map((h: any) => ReturnStatusHistory.fromPrisma(h));
  }
}

