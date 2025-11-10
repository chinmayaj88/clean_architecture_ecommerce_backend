import { PrismaClient } from '@prisma/client';
import { IOrderNoteRepository, CreateOrderNoteData, UpdateOrderNoteData } from '../../ports/interfaces/IOrderNoteRepository';
import { OrderNote } from '../../core/entities/OrderNote';

export class PrismaOrderNoteRepository implements IOrderNoteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(note: CreateOrderNoteData): Promise<OrderNote> {
    const created = await this.prisma.orderNote.create({
      data: {
        orderId: note.orderId,
        note: note.note,
        createdBy: note.createdBy,
        isInternal: note.isInternal,
      },
    });

    return OrderNote.fromPrisma(created);
  }

  async findById(id: string): Promise<OrderNote | null> {
    const note = await this.prisma.orderNote.findUnique({
      where: { id },
    });

    if (!note) {
      return null;
    }

    return OrderNote.fromPrisma(note);
  }

  async findByOrderId(orderId: string, includeInternal: boolean = false): Promise<OrderNote[]> {
    const notes = await this.prisma.orderNote.findMany({
      where: {
        orderId,
        ...(includeInternal === false && { isInternal: false }),
      },
      orderBy: { createdAt: 'asc' },
    });

    return notes.map((note: any) => OrderNote.fromPrisma(note));
  }

  async update(id: string, data: UpdateOrderNoteData): Promise<OrderNote> {
    const updated = await this.prisma.orderNote.update({
      where: { id },
      data: {
        note: data.note,
      },
    });

    return OrderNote.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.orderNote.delete({
      where: { id },
    });
  }
}

