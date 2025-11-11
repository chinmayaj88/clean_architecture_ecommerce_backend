import { PrismaClient } from '@prisma/client';
import { IRefundRepository, CreateRefundData, UpdateRefundData, RefundFilterOptions } from '../../ports/interfaces/IRefundRepository';
import { Refund } from '../../core/entities/Refund';

export class PrismaRefundRepository implements IRefundRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateRefundData): Promise<Refund> {
    const created = await (this.prisma as any).refund.create({
      data: {
        returnRequestId: data.returnRequestId,
        paymentId: data.paymentId || null,
        orderId: data.orderId,
        userId: data.userId,
        refundMethod: data.refundMethod,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: data.status || 'pending',
        reason: data.reason || null,
      },
    });

    return Refund.fromPrisma(created);
  }

  async findById(id: string): Promise<Refund | null> {
    const refund = await (this.prisma as any).refund.findUnique({
      where: { id },
    });

    if (!refund) {
      return null;
    }

    return Refund.fromPrisma(refund);
  }

  async findByReturnRequestId(returnRequestId: string): Promise<Refund[]> {
    const refunds = await (this.prisma as any).refund.findMany({
      where: { returnRequestId },
      orderBy: { createdAt: 'desc' },
    });

    return refunds.map((r: any) => Refund.fromPrisma(r));
  }

  async findByOrderId(orderId: string): Promise<Refund[]> {
    const refunds = await (this.prisma as any).refund.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return refunds.map((r: any) => Refund.fromPrisma(r));
  }

  async findAll(options?: RefundFilterOptions): Promise<Refund[]> {
    const where: any = {};

    if (options?.returnRequestId) {
      where.returnRequestId = options.returnRequestId;
    }

    if (options?.orderId) {
      where.orderId = options.orderId;
    }

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const refunds = await (this.prisma as any).refund.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return refunds.map((r: any) => Refund.fromPrisma(r));
  }

  async update(id: string, data: UpdateRefundData): Promise<Refund> {
    const updated = await (this.prisma as any).refund.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.processedAt !== undefined && { processedAt: data.processedAt }),
        ...(data.reason !== undefined && { reason: data.reason }),
      },
    });

    return Refund.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).refund.delete({
      where: { id },
    });
  }
}

