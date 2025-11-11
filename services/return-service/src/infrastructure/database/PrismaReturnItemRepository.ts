import { PrismaClient } from '@prisma/client';
import { IReturnItemRepository, CreateReturnItemData } from '../../ports/interfaces/IReturnItemRepository';
import { ReturnItem } from '../../core/entities/ReturnItem';

export class PrismaReturnItemRepository implements IReturnItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateReturnItemData): Promise<ReturnItem> {
    const created = await (this.prisma as any).returnItem.create({
      data: {
        returnRequestId: data.returnRequestId,
        orderItemId: data.orderItemId,
        productId: data.productId,
        variantId: data.variantId || null,
        productName: data.productName,
        productSku: data.productSku,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        refundAmount: data.refundAmount,
        returnReason: data.returnReason || null,
        condition: data.condition,
      },
    });

    return ReturnItem.fromPrisma(created);
  }

  async findById(id: string): Promise<ReturnItem | null> {
    const item = await (this.prisma as any).returnItem.findUnique({
      where: { id },
    });

    if (!item) {
      return null;
    }

    return ReturnItem.fromPrisma(item);
  }

  async findByReturnRequestId(returnRequestId: string): Promise<ReturnItem[]> {
    const items = await (this.prisma as any).returnItem.findMany({
      where: { returnRequestId },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((i: any) => ReturnItem.fromPrisma(i));
  }

  async update(id: string, data: Partial<CreateReturnItemData>): Promise<ReturnItem> {
    const updated = await (this.prisma as any).returnItem.update({
      where: { id },
      data,
    });

    return ReturnItem.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).returnItem.delete({
      where: { id },
    });
  }
}

