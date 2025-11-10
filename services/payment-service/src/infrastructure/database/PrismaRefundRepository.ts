import { PrismaClient } from '@prisma/client';
import { IRefundRepository, CreateRefundData, UpdateRefundData } from '../../ports/interfaces/IRefundRepository';
import { Refund } from '../../core/entities/Refund';

export class PrismaRefundRepository implements IRefundRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(refund: CreateRefundData): Promise<Refund> {
    const created = await this.prisma.refund.create({
      data: {
        paymentId: refund.paymentId,
        orderId: refund.orderId,
        reason: refund.reason,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        providerRefundId: refund.providerRefundId,
        metadata: refund.metadata || undefined,
      },
    });

    return Refund.fromPrisma(created);
  }

  async findById(id: string): Promise<Refund | null> {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
    });

    if (!refund) {
      return null;
    }

    return Refund.fromPrisma(refund);
  }

  async findByPaymentId(paymentId: string): Promise<Refund[]> {
    const refunds = await this.prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    });

    return refunds.map((refund: any) => Refund.fromPrisma(refund));
  }

  async findByOrderId(orderId: string): Promise<Refund[]> {
    const refunds = await this.prisma.refund.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return refunds.map((refund: any) => Refund.fromPrisma(refund));
  }

  async update(id: string, data: UpdateRefundData): Promise<Refund> {
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.providerRefundId !== undefined) updateData.providerRefundId = data.providerRefundId;
    if (data.processedAt !== undefined) updateData.processedAt = data.processedAt;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updated = await this.prisma.refund.update({
      where: { id },
      data: updateData,
    });

    return Refund.fromPrisma(updated);
  }
}

