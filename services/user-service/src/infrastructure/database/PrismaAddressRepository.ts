/**
 * Prisma Address Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IAddressRepository } from '../../ports/interfaces/IAddressRepository';
import { Address, CreateAddressData, UpdateAddressData } from '../../core/entities/Address';

export class PrismaAddressRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateAddressData): Promise<Address> {
    // If setting as default, unset other defaults of same type
    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: {
          userId: data.userId,
          type: data.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        userId: data.userId,
        type: data.type,
        isDefault: data.isDefault ?? false,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
      },
    });

    return this.mapToEntity(address);
  }

  async findById(id: string): Promise<Address | null> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    return address ? this.mapToEntity(address) : null;
  }

  async findByUserId(userId: string): Promise<Address[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map((a: any) => this.mapToEntity(a));
  }

  async findByUserIdAndType(userId: string, type: 'shipping' | 'billing' | 'both'): Promise<Address[]> {
    const addresses = await this.prisma.address.findMany({
      where: {
        userId,
        type: type === 'both' ? undefined : type,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map((a: any) => this.mapToEntity(a));
  }

  async findDefaultByUserId(userId: string, type: 'shipping' | 'billing'): Promise<Address | null> {
    const address = await this.prisma.address.findFirst({
      where: {
        userId,
        type,
        isDefault: true,
      },
    });

    return address ? this.mapToEntity(address) : null;
  }

  async update(id: string, data: UpdateAddressData): Promise<Address> {
    // If setting as default, unset other defaults of same type
    if (data.isDefault) {
      const address = await this.prisma.address.findUnique({ where: { id } });
      if (address) {
        await this.prisma.address.updateMany({
          where: {
            userId: address.userId,
            type: data.type || address.type,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }
    }

    const address = await this.prisma.address.update({
      where: { id },
      data: {
        type: data.type,
        isDefault: data.isDefault,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
      },
    });

    return this.mapToEntity(address);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.address.delete({
      where: { id },
    });
  }

  async setAsDefault(userId: string, addressId: string, type: 'shipping' | 'billing'): Promise<void> {
    // Unset other defaults of same type
    await this.prisma.address.updateMany({
      where: {
        userId,
        type,
        isDefault: true,
        id: { not: addressId },
      },
      data: { isDefault: false },
    });

    // Set this as default
    await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  private mapToEntity(address: {
    id: string;
    userId: string;
    type: string;
    isDefault: boolean;
    firstName: string;
    lastName: string;
    company: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Address {
    return {
      id: address.id,
      userId: address.userId,
      type: address.type as 'shipping' | 'billing' | 'both',
      isDefault: address.isDefault,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company ?? undefined,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? undefined,
      city: address.city,
      state: address.state ?? undefined,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone ?? undefined,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}

