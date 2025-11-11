import { PrismaClient } from '@prisma/client';
import { IShippingRateRepository, CreateShippingRateData, UpdateShippingRateData } from '../../ports/interfaces/IShippingRateRepository';
import { ShippingRate } from '../../core/entities/ShippingRate';

export class PrismaShippingRateRepository implements IShippingRateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateShippingRateData): Promise<ShippingRate> {
    const created = await (this.prisma as any).shippingRate.create({
      data: {
        methodId: data.methodId,
        minWeight: data.minWeight,
        maxWeight: data.maxWeight || null,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount || null,
        rate: data.rate,
      },
    });

    return ShippingRate.fromPrisma(created);
  }

  async findById(id: string): Promise<ShippingRate | null> {
    const rate = await (this.prisma as any).shippingRate.findUnique({
      where: { id },
    });

    if (!rate) {
      return null;
    }

    return ShippingRate.fromPrisma(rate);
  }

  async findByMethodId(methodId: string): Promise<ShippingRate[]> {
    const rates = await (this.prisma as any).shippingRate.findMany({
      where: { methodId },
      orderBy: [
        { minWeight: 'asc' },
        { minAmount: 'asc' },
      ],
    });

    return rates.map((r: any) => ShippingRate.fromPrisma(r));
  }

  async findMatchingRate(methodId: string, weight: number, orderAmount: number): Promise<ShippingRate | null> {
    const rates = await this.findByMethodId(methodId);
    
    // Find first matching rate
    for (const rate of rates) {
      if (rate.matches(weight, orderAmount)) {
        return rate;
      }
    }
    
    return null;
  }

  async update(id: string, data: UpdateShippingRateData): Promise<ShippingRate> {
    const updated = await (this.prisma as any).shippingRate.update({
      where: { id },
      data: {
        ...(data.minWeight !== undefined && { minWeight: data.minWeight }),
        ...(data.maxWeight !== undefined && { maxWeight: data.maxWeight }),
        ...(data.minAmount !== undefined && { minAmount: data.minAmount }),
        ...(data.maxAmount !== undefined && { maxAmount: data.maxAmount }),
        ...(data.rate !== undefined && { rate: data.rate }),
      },
    });

    return ShippingRate.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).shippingRate.delete({
      where: { id },
    });
  }
}

