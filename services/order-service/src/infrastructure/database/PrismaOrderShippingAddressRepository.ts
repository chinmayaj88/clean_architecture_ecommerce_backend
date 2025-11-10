import { PrismaClient } from '@prisma/client';
import { IOrderShippingAddressRepository, CreateOrderShippingAddressData } from '../../ports/interfaces/IOrderShippingAddressRepository';
import { OrderShippingAddress } from '../../core/entities/OrderShippingAddress';

export class PrismaOrderShippingAddressRepository implements IOrderShippingAddressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(address: CreateOrderShippingAddressData): Promise<OrderShippingAddress> {
    const created = await this.prisma.orderShippingAddress.create({
      data: {
        orderId: address.orderId,
        firstName: address.firstName,
        lastName: address.lastName,
        company: address.company,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone,
      },
    });

    return OrderShippingAddress.fromPrisma(created);
  }

  async findByOrderId(orderId: string): Promise<OrderShippingAddress | null> {
    const address = await this.prisma.orderShippingAddress.findUnique({
      where: { orderId },
    });

    if (!address) {
      return null;
    }

    return OrderShippingAddress.fromPrisma(address);
  }

  async update(orderId: string, data: Partial<CreateOrderShippingAddressData>): Promise<OrderShippingAddress> {
    const updated = await this.prisma.orderShippingAddress.update({
      where: { orderId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
        ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });

    return OrderShippingAddress.fromPrisma(updated);
  }
}

