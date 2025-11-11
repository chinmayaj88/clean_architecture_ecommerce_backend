import { PrismaClient } from '@prisma/client';
import { IShippingMethodRepository, CreateShippingMethodData, UpdateShippingMethodData } from '../../ports/interfaces/IShippingMethodRepository';
import { ShippingMethod } from '../../core/entities/ShippingMethod';

export class PrismaShippingMethodRepository implements IShippingMethodRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateShippingMethodData): Promise<ShippingMethod> {
    const created = await (this.prisma as any).shippingMethod.create({
      data: {
        zoneId: data.zoneId,
        name: data.name,
        carrier: data.carrier,
        serviceType: data.serviceType,
        basePrice: data.basePrice,
        pricePerKg: data.pricePerKg || null,
        pricePerItem: data.pricePerItem || null,
        estimatedDays: data.estimatedDays || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        configuration: data.configuration || null,
      },
    });

    return ShippingMethod.fromPrisma(created);
  }

  async findById(id: string): Promise<ShippingMethod | null> {
    const method = await (this.prisma as any).shippingMethod.findUnique({
      where: { id },
    });

    if (!method) {
      return null;
    }

    return ShippingMethod.fromPrisma(method);
  }

  async findByZoneId(zoneId: string, activeOnly: boolean = false): Promise<ShippingMethod[]> {
    const where: any = { zoneId };
    if (activeOnly) {
      where.isActive = true;
    }

    const methods = await (this.prisma as any).shippingMethod.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return methods.map((m: any) => ShippingMethod.fromPrisma(m));
  }

  async findAll(activeOnly: boolean = false): Promise<ShippingMethod[]> {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const methods = await (this.prisma as any).shippingMethod.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return methods.map((m: any) => ShippingMethod.fromPrisma(m));
  }

  async update(id: string, data: UpdateShippingMethodData): Promise<ShippingMethod> {
    const updated = await (this.prisma as any).shippingMethod.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.carrier !== undefined && { carrier: data.carrier }),
        ...(data.serviceType !== undefined && { serviceType: data.serviceType }),
        ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
        ...(data.pricePerKg !== undefined && { pricePerKg: data.pricePerKg }),
        ...(data.pricePerItem !== undefined && { pricePerItem: data.pricePerItem }),
        ...(data.estimatedDays !== undefined && { estimatedDays: data.estimatedDays }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.configuration !== undefined && { configuration: data.configuration }),
      },
    });

    return ShippingMethod.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).shippingMethod.delete({
      where: { id },
    });
  }
}

