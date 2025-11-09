import { PrismaClient } from '@prisma/client';
import { ProductInventory } from '../../core/entities/ProductInventory';
import { IProductInventoryRepository, CreateProductInventoryData, UpdateProductInventoryData } from '../../ports/interfaces/IProductInventoryRepository';

export class PrismaProductInventoryRepository implements IProductInventoryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateProductInventoryData): Promise<ProductInventory> {
    const availableQuantity = (data.quantity ?? 0) - (data.reservedQuantity ?? 0);

    const inventory = await this.prisma.productInventory.create({
      data: {
        productId: data.productId,
        variantId: data.variantId || null,
        quantity: data.quantity ?? 0,
        reservedQuantity: data.reservedQuantity ?? 0,
        availableQuantity,
        location: data.location || null,
      },
    });

    return this.mapToEntity(inventory);
  }

  async findById(id: string): Promise<ProductInventory | null> {
    const inventory = await this.prisma.productInventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      return null;
    }

    return this.mapToEntity(inventory);
  }

  async findByProductId(productId: string): Promise<ProductInventory | null> {
    const inventory = await this.prisma.productInventory.findFirst({
      where: { productId, variantId: null },
    });

    if (!inventory) {
      return null;
    }

    return this.mapToEntity(inventory);
  }

  async findByProductIdAndVariantId(productId: string, variantId: string | null): Promise<ProductInventory | null> {
    const inventory = await this.prisma.productInventory.findUnique({
      where: {
        productId_variantId: {
          productId,
          variantId: variantId ?? (null as any),
        },
      },
    } as any);

    if (!inventory) {
      return null;
    }

    return this.mapToEntity(inventory);
  }

  async update(id: string, data: UpdateProductInventoryData): Promise<ProductInventory> {
    const updateData: any = {
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.reservedQuantity !== undefined && { reservedQuantity: data.reservedQuantity }),
      ...(data.availableQuantity !== undefined && { availableQuantity: data.availableQuantity }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.lastRestockedAt !== undefined && { lastRestockedAt: data.lastRestockedAt }),
    };

    // Recalculate availableQuantity if quantity or reservedQuantity changed
    if (data.quantity !== undefined || data.reservedQuantity !== undefined) {
      const current = await this.prisma.productInventory.findUnique({ where: { id } });
      if (current) {
        const quantity = data.quantity ?? current.quantity;
        const reservedQuantity = data.reservedQuantity ?? current.reservedQuantity;
        updateData.availableQuantity = quantity - reservedQuantity;
      }
    }

    const inventory = await this.prisma.productInventory.update({
      where: { id },
      data: updateData,
    });

    return this.mapToEntity(inventory);
  }

  async reserve(productId: string, variantId: string | null, quantity: number): Promise<ProductInventory> {
    const inventory = await this.findByProductIdAndVariantId(productId, variantId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    if (inventory.availableQuantity < quantity) {
      throw new Error('Insufficient available quantity');
    }

    return await this.update(inventory.id, {
      reservedQuantity: inventory.reservedQuantity + quantity,
    });
  }

  async release(productId: string, variantId: string | null, quantity: number): Promise<ProductInventory> {
    const inventory = await this.findByProductIdAndVariantId(productId, variantId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    if (inventory.reservedQuantity < quantity) {
      throw new Error('Cannot release more than reserved quantity');
    }

    return await this.update(inventory.id, {
      reservedQuantity: inventory.reservedQuantity - quantity,
    });
  }

  async adjust(productId: string, variantId: string | null, quantity: number, _reason?: string): Promise<ProductInventory> {
    const inventory = await this.findByProductIdAndVariantId(productId, variantId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const newQuantity = inventory.quantity + quantity;
    if (newQuantity < 0) {
      throw new Error('Inventory quantity cannot be negative');
    }

    return await this.update(inventory.id, {
      quantity: newQuantity,
      lastRestockedAt: quantity > 0 ? new Date() : inventory.lastRestockedAt,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productInventory.delete({
      where: { id },
    });
  }

  private mapToEntity(inventory: any): ProductInventory {
    return new ProductInventory(
      inventory.id,
      inventory.productId,
      inventory.variantId,
      inventory.quantity,
      inventory.reservedQuantity,
      inventory.availableQuantity,
      inventory.location,
      inventory.lastRestockedAt,
      inventory.createdAt,
      inventory.updatedAt
    );
  }
}

