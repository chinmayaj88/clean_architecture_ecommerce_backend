import { PrismaClient } from '@prisma/client';
import { ICarrierRepository, CreateCarrierData, UpdateCarrierData } from '../../ports/interfaces/ICarrierRepository';
import { Carrier } from '../../core/entities/Carrier';

export class PrismaCarrierRepository implements ICarrierRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateCarrierData): Promise<Carrier> {
    // TODO: Encrypt apiKey before storing
    const created = await (this.prisma as any).carrier.create({
      data: {
        name: data.name,
        code: data.code,
        apiEndpoint: data.apiEndpoint,
        apiKey: data.apiKey, // Should be encrypted
        isActive: data.isActive !== undefined ? data.isActive : true,
        configuration: data.configuration || null,
      },
    });

    return Carrier.fromPrisma(created);
  }

  async findById(id: string): Promise<Carrier | null> {
    const carrier = await (this.prisma as any).carrier.findUnique({
      where: { id },
    });

    if (!carrier) {
      return null;
    }

    // TODO: Decrypt apiKey after retrieval
    return Carrier.fromPrisma(carrier);
  }

  async findByCode(code: string): Promise<Carrier | null> {
    const carrier = await (this.prisma as any).carrier.findUnique({
      where: { code },
    });

    if (!carrier) {
      return null;
    }

    // TODO: Decrypt apiKey after retrieval
    return Carrier.fromPrisma(carrier);
  }

  async findAll(activeOnly: boolean = false): Promise<Carrier[]> {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const carriers = await (this.prisma as any).carrier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // TODO: Decrypt apiKey for each carrier
    return carriers.map((c: any) => Carrier.fromPrisma(c));
  }

  async update(id: string, data: UpdateCarrierData): Promise<Carrier> {
    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.apiEndpoint !== undefined) {
      updateData.apiEndpoint = data.apiEndpoint;
    }
    if (data.apiKey !== undefined) {
      // TODO: Encrypt apiKey before storing
      updateData.apiKey = data.apiKey;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    if (data.configuration !== undefined) {
      updateData.configuration = data.configuration;
    }

    const updated = await (this.prisma as any).carrier.update({
      where: { id },
      data: updateData,
    });

    // TODO: Decrypt apiKey after retrieval
    return Carrier.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).carrier.delete({
      where: { id },
    });
  }
}

