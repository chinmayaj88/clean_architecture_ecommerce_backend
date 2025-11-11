import { PrismaClient } from '@prisma/client';
import { IReturnAuthorizationRepository, CreateReturnAuthorizationData, UpdateReturnAuthorizationData } from '../../ports/interfaces/IReturnAuthorizationRepository';
import { ReturnAuthorization } from '../../core/entities/ReturnAuthorization';

export class PrismaReturnAuthorizationRepository implements IReturnAuthorizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateReturnAuthorizationData): Promise<ReturnAuthorization> {
    const created = await (this.prisma as any).returnAuthorization.create({
      data: {
        returnRequestId: data.returnRequestId,
        rmaNumber: data.rmaNumber,
        returnAddress: data.returnAddress,
        returnInstructions: data.returnInstructions || null,
        trackingNumber: data.trackingNumber || null,
        expiresAt: data.expiresAt || null,
      },
    });

    return ReturnAuthorization.fromPrisma(created);
  }

  async findById(id: string): Promise<ReturnAuthorization | null> {
    const auth = await (this.prisma as any).returnAuthorization.findUnique({
      where: { id },
    });

    if (!auth) {
      return null;
    }

    return ReturnAuthorization.fromPrisma(auth);
  }

  async findByRmaNumber(rmaNumber: string): Promise<ReturnAuthorization | null> {
    const auth = await (this.prisma as any).returnAuthorization.findUnique({
      where: { rmaNumber },
    });

    if (!auth) {
      return null;
    }

    return ReturnAuthorization.fromPrisma(auth);
  }

  async findByReturnRequestId(returnRequestId: string): Promise<ReturnAuthorization | null> {
    const auth = await (this.prisma as any).returnAuthorization.findUnique({
      where: { returnRequestId },
    });

    if (!auth) {
      return null;
    }

    return ReturnAuthorization.fromPrisma(auth);
  }

  async update(id: string, data: UpdateReturnAuthorizationData): Promise<ReturnAuthorization> {
    const updated = await (this.prisma as any).returnAuthorization.update({
      where: { id },
      data: {
        ...(data.returnAddress !== undefined && { returnAddress: data.returnAddress }),
        ...(data.returnInstructions !== undefined && { returnInstructions: data.returnInstructions }),
        ...(data.trackingNumber !== undefined && { trackingNumber: data.trackingNumber }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      },
    });

    return ReturnAuthorization.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).returnAuthorization.delete({
      where: { id },
    });
  }
}

