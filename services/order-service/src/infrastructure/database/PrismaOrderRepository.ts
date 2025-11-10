import { PrismaClient } from '@prisma/client';
import { IOrderRepository, CreateOrderData, UpdateOrderData, OrderQueryOptions, PaginatedOrders } from '../../ports/interfaces/IOrderRepository';
import { Order, OrderStatus } from '../../core/entities/Order';
import { getCache } from '../cache/RedisCache';

const CACHE_TTL = {
  ORDER_BY_ID: 600,
  ORDER_BY_NUMBER: 600,
  ORDER_BY_USER_ID: 300,
};

export class PrismaOrderRepository implements IOrderRepository {
  private cache = getCache();

  constructor(private readonly prisma: PrismaClient) {}

  async create(order: CreateOrderData): Promise<Order> {
    const created = await this.prisma.order.create({
      data: {
        orderNumber: order.orderNumber,
        userId: order.userId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        shippingAmount: order.shippingAmount,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
        currency: order.currency,
        paymentMethodId: order.paymentMethodId,
        shippingMethod: order.shippingMethod,
        trackingNumber: order.trackingNumber,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        metadata: order.metadata || undefined,
      },
    });

    const entity = Order.fromPrisma(created);
    await this.invalidateCache(entity);

    return entity;
  }

  async findById(id: string): Promise<Order | null> {
    const cacheKey = `order:id:${id}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return Order.fromPrisma(cached);
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return null;
    }

    const entity = Order.fromPrisma(order);
    await this.cache.set(cacheKey, order, CACHE_TTL.ORDER_BY_ID);

    return entity;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const cacheKey = `order:number:${orderNumber}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return Order.fromPrisma(cached);
    }

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return null;
    }

    const entity = Order.fromPrisma(order);
    await this.cache.set(cacheKey, order, CACHE_TTL.ORDER_BY_NUMBER);

    return entity;
  }

  async findByUserId(userId: string, status?: OrderStatus): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order: any) => Order.fromPrisma(order));
  }

  async findByUserIdPaginated(userId: string, options: OrderQueryOptions = {}): Promise<PaginatedOrders> {
    const {
      status,
      paymentStatus,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = options;

    const where: any = {
      userId,
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
    };

    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Amount range filtering
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.totalAmount = {};
      if (minAmount !== undefined) {
        where.totalAmount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.totalAmount.lte = maxAmount;
      }
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'totalAmount') {
      orderBy.totalAmount = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    }

    // Get total count
    const total = await this.prisma.order.count({ where });

    // Get orders
    const orders = await this.prisma.order.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    });

    return {
      orders: orders.map((order: any) => Order.fromPrisma(order)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async findByStatus(status: OrderStatus, limit: number = 100): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return orders.map((order: any) => Order.fromPrisma(order));
  }

  async update(id: string, data: UpdateOrderData): Promise<Order> {
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.shippingMethod !== undefined) updateData.shippingMethod = data.shippingMethod;
    if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
    if (data.estimatedDeliveryDate !== undefined) updateData.estimatedDeliveryDate = data.estimatedDeliveryDate;
    if (data.shippedAt !== undefined) updateData.shippedAt = data.shippedAt;
    if (data.deliveredAt !== undefined) updateData.deliveredAt = data.deliveredAt;
    if (data.cancelledAt !== undefined) updateData.cancelledAt = data.cancelledAt;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updated = await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    const entity = Order.fromPrisma(updated);
    await this.invalidateCache(entity);

    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({
      where: { id },
    });

    await this.cache.delPattern(`order:id:${id}*`);
    await this.cache.delPattern(`order:number:*`);
  }

  private async invalidateCache(order: Order): Promise<void> {
    await this.cache.del(`order:id:${order.id}`);
    await this.cache.del(`order:number:${order.orderNumber}`);
    await this.cache.delPattern(`order:userId:${order.userId}*`);
  }
}

