import { PrismaClient } from '@prisma/client';
import { IPaymentRepository, CreatePaymentData, UpdatePaymentData, PaymentQueryOptions, PaginatedPayments } from '../../ports/interfaces/IPaymentRepository';
import { Payment, PaymentStatus } from '../../core/entities/Payment';
import { getCache } from '../cache/RedisCache';

const CACHE_TTL = {
  PAYMENT_BY_ID: 600,
  PAYMENT_BY_ORDER_ID: 600,
  PAYMENT_BY_USER_ID: 300,
};

export class PrismaPaymentRepository implements IPaymentRepository {
  private cache = getCache();

  constructor(private readonly prisma: PrismaClient) {}

  async create(payment: CreatePaymentData): Promise<Payment> {
    const created = await this.prisma.payment.create({
      data: {
        orderId: payment.orderId,
        userId: payment.userId,
        paymentMethodId: payment.paymentMethodId,
        status: payment.status,
        paymentProvider: payment.paymentProvider,
        providerPaymentId: payment.providerPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        metadata: payment.metadata || undefined,
      },
    });

    const entity = Payment.fromPrisma(created);
    await this.invalidateCache(entity);

    return entity;
  }

  async findById(id: string): Promise<Payment | null> {
    const cacheKey = `payment:id:${id}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return Payment.fromPrisma(cached);
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return null;
    }

    const entity = Payment.fromPrisma(payment);
    await this.cache.set(cacheKey, payment, CACHE_TTL.PAYMENT_BY_ID);

    return entity;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const cacheKey = `payment:order:${orderId}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return Payment.fromPrisma(cached);
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      return null;
    }

    const entity = Payment.fromPrisma(payment);
    await this.cache.set(cacheKey, payment, CACHE_TTL.PAYMENT_BY_ORDER_ID);

    return entity;
  }

  async findByProviderPaymentId(providerPaymentId: string): Promise<Payment | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { providerPaymentId },
    });

    if (!payment) {
      return null;
    }

    return Payment.fromPrisma(payment);
  }

  async findByUserId(userId: string, status?: PaymentStatus): Promise<Payment[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment: any) => Payment.fromPrisma(payment));
  }

  async findByUserIdPaginated(userId: string, options: PaymentQueryOptions = {}): Promise<PaginatedPayments> {
    const {
      status,
      paymentProvider,
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
      ...(paymentProvider && { paymentProvider }),
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
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount.lte = maxAmount;
      }
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'amount') {
      orderBy.amount = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    }

    // Get total count
    const total = await this.prisma.payment.count({ where });

    // Get payments
    const payments = await this.prisma.payment.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    });

    return {
      payments: payments.map((payment: any) => Payment.fromPrisma(payment)),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async update(id: string, data: UpdatePaymentData): Promise<Payment> {
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.providerPaymentId !== undefined) updateData.providerPaymentId = data.providerPaymentId;
    if (data.processedAt !== undefined) updateData.processedAt = data.processedAt;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updated = await this.prisma.payment.update({
      where: { id },
      data: updateData,
    });

    const entity = Payment.fromPrisma(updated);
    await this.invalidateCache(entity);

    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.payment.delete({
      where: { id },
    });

    await this.cache.delPattern(`payment:id:${id}*`);
    await this.cache.delPattern(`payment:order:*`);
  }

  private async invalidateCache(payment: Payment): Promise<void> {
    await this.cache.del(`payment:id:${payment.id}`);
    await this.cache.del(`payment:order:${payment.orderId}`);
    await this.cache.delPattern(`payment:userId:${payment.userId}*`);
  }
}

