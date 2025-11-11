import { PrismaClient } from '@prisma/client';
import { IReturnTrackingRepository, CreateTrackingData } from '../../ports/interfaces/IReturnTrackingRepository';
import { ReturnTracking } from '../../core/entities/ReturnTracking';

export class PrismaReturnTrackingRepository implements IReturnTrackingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateTrackingData): Promise<ReturnTracking> {
    const created = await (this.prisma as any).returnTracking.create({
      data: {
        authorizationId: data.authorizationId,
        status: data.status,
        location: data.location || null,
        description: data.description || null,
        timestamp: data.timestamp,
        carrierData: data.carrierData || null,
      },
    });

    return ReturnTracking.fromPrisma(created);
  }

  async findByAuthorizationId(authorizationId: string): Promise<ReturnTracking[]> {
    const tracking = await (this.prisma as any).returnTracking.findMany({
      where: { authorizationId },
      orderBy: { timestamp: 'asc' },
    });

    return tracking.map((t: any) => ReturnTracking.fromPrisma(t));
  }
}

