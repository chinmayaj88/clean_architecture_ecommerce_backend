import { PrismaClient } from '@prisma/client';
import { IOrderItemRepository, CreateOrderItemData } from '../../ports/interfaces/IOrderItemRepository';
import { OrderItem } from '../../core/entities/OrderItem';

export class PrismaOrderItemRepository implements IOrderItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(item: CreateOrderItemData): Promise<OrderItem> {
    const created = await this.prisma.orderItem.create({
      data: {
        orderId: item.orderId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        productSku: item.productSku,
        productImageUrl: item.productImageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      },
    });

    return OrderItem.fromPrisma(created);
  }

  async createMany(items: CreateOrderItemData[]): Promise<OrderItem[]> {
    await this.prisma.orderItem.createMany({
      data: items.map(item => ({
        orderId: item.orderId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        productSku: item.productSku,
        productImageUrl: item.productImageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      })),
    });

    // Fetch created items
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        orderId: items[0]?.orderId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return orderItems.map((item: any) => OrderItem.fromPrisma(item));
  }

  async findById(id: string): Promise<OrderItem | null> {
    const item = await this.prisma.orderItem.findUnique({
      where: { id },
    });

    if (!item) {
      return null;
    }

    return OrderItem.fromPrisma(item);
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item: any) => OrderItem.fromPrisma(item));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.orderItem.delete({
      where: { id },
    });
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.prisma.orderItem.deleteMany({
      where: { orderId },
    });
  }
}

