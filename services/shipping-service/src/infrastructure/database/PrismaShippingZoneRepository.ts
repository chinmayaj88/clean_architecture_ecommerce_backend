import { PrismaClient } from '@prisma/client';
import { IShippingZoneRepository, CreateShippingZoneData, UpdateShippingZoneData } from '../../ports/interfaces/IShippingZoneRepository';
import { ShippingZone } from '../../core/entities/ShippingZone';

export class PrismaShippingZoneRepository implements IShippingZoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateShippingZoneData): Promise<ShippingZone> {
    const created = await (this.prisma as any).shippingZone.create({
      data: {
        name: data.name,
        type: data.type,
        countries: data.countries,
        states: data.states || null,
        postalCodes: data.postalCodes || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return ShippingZone.fromPrisma(created);
  }

  async findById(id: string): Promise<ShippingZone | null> {
    const zone = await (this.prisma as any).shippingZone.findUnique({
      where: { id },
    });

    if (!zone) {
      return null;
    }

    return ShippingZone.fromPrisma(zone);
  }

  async findAll(activeOnly: boolean = false): Promise<ShippingZone[]> {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const zones = await (this.prisma as any).shippingZone.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return zones.map((z: any) => ShippingZone.fromPrisma(z));
  }

  async findByLocation(countryCode: string, stateCode?: string, postalCode?: string): Promise<ShippingZone[]> {
    const zones = await this.findAll(true);
    
    return zones.filter(zone => {
      if (!zone.matchesCountry(countryCode)) {
        return false;
      }
      
      if (stateCode && zone.states && zone.states.length > 0) {
        if (!zone.matchesState(stateCode)) {
          return false;
        }
      }
      
      if (postalCode && zone.postalCodes && zone.postalCodes.length > 0) {
        if (!zone.matchesPostalCode(postalCode)) {
          return false;
        }
      }
      
      return true;
    });
  }

  async update(id: string, data: UpdateShippingZoneData): Promise<ShippingZone> {
    const updated = await (this.prisma as any).shippingZone.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.countries !== undefined && { countries: data.countries }),
        ...(data.states !== undefined && { states: data.states }),
        ...(data.postalCodes !== undefined && { postalCodes: data.postalCodes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return ShippingZone.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await (this.prisma as any).shippingZone.delete({
      where: { id },
    });
  }
}

