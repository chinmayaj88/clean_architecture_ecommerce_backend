import { IOrderNoteRepository } from '../../ports/interfaces/IOrderNoteRepository';
import { IOrderRepository } from '../../ports/interfaces/IOrderRepository';
import { OrderNote } from '../../core/entities/OrderNote';
import { AppError } from '../../middleware/errorHandler.middleware';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface CreateOrderNoteInput {
  orderId: string;
  note: string;
  createdBy: string;
  isInternal: boolean;
}

export interface UpdateOrderNoteInput {
  noteId: string;
  note: string;
  updatedBy: string;
}

export class CreateOrderNoteUseCase {
  constructor(
    private readonly orderNoteRepository: IOrderNoteRepository,
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(input: CreateOrderNoteInput): Promise<OrderNote> {
    // Verify order exists
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    const orderNote = await this.orderNoteRepository.create({
      orderId: input.orderId,
      note: input.note,
      createdBy: input.createdBy,
      isInternal: input.isInternal,
    });

    logger.info('Order note created', {
      noteId: orderNote.id,
      orderId: input.orderId,
      isInternal: input.isInternal,
    });

    return orderNote;
  }
}

export class GetOrderNotesUseCase {
  constructor(private readonly orderNoteRepository: IOrderNoteRepository) {}

  async execute(orderId: string, includeInternal: boolean = false): Promise<OrderNote[]> {
    const notes = await this.orderNoteRepository.findByOrderId(orderId);
    
    if (!includeInternal) {
      return notes.filter(note => !note.isInternal);
    }

    return notes;
  }
}

export class UpdateOrderNoteUseCase {
  constructor(
    private readonly orderNoteRepository: IOrderNoteRepository,
    private readonly orderRepository: IOrderRepository
  ) {}

  async execute(input: UpdateOrderNoteInput): Promise<OrderNote> {
    const note = await this.orderNoteRepository.findById(input.noteId);
    if (!note) {
      throw new AppError(404, 'Order note not found');
    }

    // Verify order exists
    const order = await this.orderRepository.findById(note.orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    const updatedNote = await this.orderNoteRepository.update(input.noteId, {
      note: input.note,
    });

    logger.info('Order note updated', {
      noteId: input.noteId,
      orderId: note.orderId,
    });

    return updatedNote;
  }
}

export class DeleteOrderNoteUseCase {
  constructor(private readonly orderNoteRepository: IOrderNoteRepository) {}

  async execute(noteId: string): Promise<void> {
    const note = await this.orderNoteRepository.findById(noteId);
    if (!note) {
      throw new AppError(404, 'Order note not found');
    }

    await this.orderNoteRepository.delete(noteId);

    logger.info('Order note deleted', {
      noteId,
      orderId: note.orderId,
    });
  }
}

