import { PrismaClient } from '@prisma/client';
import { IShipmentTrackingRepository, CreateShipmentTrackingData } from '../../ports/interfaces/IShipmentTrackingRepository';
import { ShipmentTracking } from '../../core/entities/ShipmentTracking';

export class PrismaShipmentTrackingRepository implements IShipmentTrackingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateShipmentTrackingData): Promise<ShipmentTracking> {
    const created = await (this.prisma as any).shipmentTracking.create({
      data: {
        shipmentId: data.shipmentId,
        status: data.status,
        location: data.location || null,
        description: data.description || null,
        timestamp: data.timestamp,
        carrierData: data.carrierData || null,
      },
    });

    return ShipmentTracking.fromPrisma(created);
  }

  async findById(id: string): Promise<ShipmentTracking | null> {
    const tracking = await (this.prisma as any).shipmentTracking.findUnique({
      where: { id },
    });

    if (!tracking) {
      return null;
    }

    return ShipmentTracking.fromPrisma(tracking);
  }

  async findByShipmentId(shipmentId: string): Promise<ShipmentTracking[]> {
    const tracking = await (this.prisma as any).shipmentTracking.findMany({
      where: { shipmentId },
      orderBy: { timestamp: 'asc' },
    });

    return tracking.map((t: any) => ShipmentTracking.fromPrisma(t));
  }

  async findLatestByShipmentId(shipmentId: string): Promise<ShipmentTracking | null> {
    const tracking = await (this.prisma as any).shipmentTracking.findFirst({
      where: { shipmentId },
      orderBy: { timestamp: 'desc' },
    });

    if (!tracking) {
      return null;
    }

    return ShipmentTracking.fromPrisma(tracking);
  }
}

