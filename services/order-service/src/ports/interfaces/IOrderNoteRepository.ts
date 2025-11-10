import { OrderNote } from '../../core/entities/OrderNote';

export interface CreateOrderNoteData {
  orderId: string;
  note: string;
  createdBy: string;
  isInternal: boolean;
}

export interface UpdateOrderNoteData {
  note: string;
}

export interface IOrderNoteRepository {
  create(note: CreateOrderNoteData): Promise<OrderNote>;
  findById(id: string): Promise<OrderNote | null>;
  findByOrderId(orderId: string, includeInternal?: boolean): Promise<OrderNote[]>;
  update(id: string, data: UpdateOrderNoteData): Promise<OrderNote>;
  delete(id: string): Promise<void>;
}

