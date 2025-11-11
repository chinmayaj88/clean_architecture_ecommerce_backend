import { PrismaClient } from '@prisma/client';
import { IShipmentRepository, CreateShipmentData, UpdateShipmentData, ShipmentFilterOptions } from '../../ports/interfaces/IShipmentRepository';
import { Shipment, ShipmentStatus } from '../../core/entities/Shipment';

export class PrismaShipmentRepository implements IShipmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateShipmentData): Promise<Shipment> {
    const created = await (this.prisma as any).shipment.create({
      data: {
        orderId: data.orderId,
        carrierId: data.carrierId || null,
        methodId: data.methodId || null,
        trackingNumber: data.trackingNumber,
        status: data.status || ShipmentStatus.PENDING,
        weight: data.weight,
        cost: data.cost,
        originAddress: data.originAddress,
        destinationAddress: data.destinationAddress,
        estimatedDeliveryDate: data.estimatedDeliveryDate || null,
        carrierResponse: data.carrierResponse || null,
      },
    });

    return Shipment.fromPrisma(created);
  }

  async findById(id: string): Promise<Shipment | null> {
    const shipment = await (this.prisma as any).shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return null;
    }

    return Shipment.fromPrisma(shipment);
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
    const shipment = await (this.prisma as any).shipment.findUnique({
      where: { trackingNumber },
    });

    if (!shipment) {
      return null;
    }

    return Shipment.fromPrisma(shipment);
  }

  async findByOrderId(orderId: string): Promise<Shipment[]> {
    const shipments = await (this.prisma as any).shipment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return shipments.map((s: any) => Shipment.fromPrisma(s));
  }

  async findAll(options?: ShipmentFilterOptions): Promise<Shipment[]> {
    const where: any = {};

    if (options?.orderId) {
      where.orderId = options.orderId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.carrierId) {
      where.carrierId = options.carrierId;
    }

    const shipments = await (this.prisma as any).shipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return shipments.map((s: any) => Shipment.fromPrisma(s));
  }

  async update(id: string, data: UpdateShipmentData): Promise<Shipment> {
    const updateData: any = {};

    if (data.carrierId !== undefined) {
      updateData.carrierId = data.carrierId;
    }
    if (data.methodId !== undefined) {
      updateData.methodId = data.methodId;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.weight !== undefined) {
      updateData.weight = data.weight;
    }
    if (data.cost !== undefined) {
      updateData.cost = data.cost;
    }
    if (data.shippedAt !== undefined) {
      updateData.shippedAt = data.shippedAt;
    }
    if (data.estimatedDeliveryDate !== undefined) {
      updateData.estimatedDeliveryDate = data.estimatedDeliveryDate;
    }
    if (data.deliveredAt !== undefined) {
      updateData.deliveredAt = data.deliveredAt;
    }
    if (data.carrierResponse !== undefined) {
      updateData.carrierResponse = data.carrierResponse;
    }

    const updated = await (this.prisma as any).shipment.update({
      where: { id },
      data: updateData,
    });

    return Shipment.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).shipment.delete({
      where: { id },
    });
  }
}

