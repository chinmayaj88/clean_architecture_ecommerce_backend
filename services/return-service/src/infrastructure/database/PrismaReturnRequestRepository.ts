import { PrismaClient } from '@prisma/client';
import { IReturnRequestRepository, CreateReturnRequestData, UpdateReturnRequestData, ReturnRequestFilterOptions } from '../../ports/interfaces/IReturnRequestRepository';
import { ReturnRequest } from '../../core/entities/ReturnRequest';

export class PrismaReturnRequestRepository implements IReturnRequestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateReturnRequestData): Promise<ReturnRequest> {
    const created = await (this.prisma as any).returnRequest.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        rmaNumber: data.rmaNumber,
        returnReason: data.returnReason,
        returnNotes: data.returnNotes || null,
        refundMethod: data.refundMethod,
        refundAmount: data.refundAmount,
        currency: data.currency || 'USD',
        metadata: data.metadata || null,
      },
    });

    return ReturnRequest.fromPrisma(created);
  }

  async findById(id: string): Promise<ReturnRequest | null> {
    const request = await (this.prisma as any).returnRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return null;
    }

    return ReturnRequest.fromPrisma(request);
  }

  async findByRmaNumber(rmaNumber: string): Promise<ReturnRequest | null> {
    const request = await (this.prisma as any).returnRequest.findUnique({
      where: { rmaNumber },
    });

    if (!request) {
      return null;
    }

    return ReturnRequest.fromPrisma(request);
  }

  async findByOrderId(orderId: string): Promise<ReturnRequest[]> {
    const requests = await (this.prisma as any).returnRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r: any) => ReturnRequest.fromPrisma(r));
  }

  async findByUserId(userId: string, options?: ReturnRequestFilterOptions): Promise<ReturnRequest[]> {
    const where: any = { userId };

    if (options?.status) {
      where.status = options.status;
    }

    const requests = await (this.prisma as any).returnRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return requests.map((r: any) => ReturnRequest.fromPrisma(r));
  }

  async findAll(options?: ReturnRequestFilterOptions): Promise<ReturnRequest[]> {
    const where: any = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.orderId) {
      where.orderId = options.orderId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.rmaNumber) {
      where.rmaNumber = options.rmaNumber;
    }

    const requests = await (this.prisma as any).returnRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return requests.map((r: any) => ReturnRequest.fromPrisma(r));
  }

  async update(id: string, data: UpdateReturnRequestData): Promise<ReturnRequest> {
    const updated = await (this.prisma as any).returnRequest.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.returnNotes !== undefined && { returnNotes: data.returnNotes }),
        ...(data.refundAmount !== undefined && { refundAmount: data.refundAmount }),
        ...(data.approvedAt !== undefined && { approvedAt: data.approvedAt }),
        ...(data.rejectedAt !== undefined && { rejectedAt: data.rejectedAt }),
        ...(data.receivedAt !== undefined && { receivedAt: data.receivedAt }),
        ...(data.processedAt !== undefined && { processedAt: data.processedAt }),
        ...(data.closedAt !== undefined && { closedAt: data.closedAt }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
      },
    });

    return ReturnRequest.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).returnRequest.delete({
      where: { id },
    });
  }
}

