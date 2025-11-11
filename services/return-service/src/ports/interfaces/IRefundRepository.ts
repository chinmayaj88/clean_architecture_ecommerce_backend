import { Refund, RefundStatus } from '../../core/entities/Refund';

export interface CreateRefundData {
  returnRequestId: string;
  paymentId?: string | null;
  orderId: string;
  userId: string;
  refundMethod: string;
  amount: number;
  currency?: string;
  status?: RefundStatus;
  reason?: string | null;
}

export interface UpdateRefundData {
  status?: RefundStatus;
  processedAt?: Date | null;
  reason?: string | null;
}

export interface RefundFilterOptions {
  returnRequestId?: string;
  orderId?: string;
  userId?: string;
  status?: RefundStatus;
  limit?: number;
  offset?: number;
}

export interface IRefundRepository {
  create(data: CreateRefundData): Promise<Refund>;
  findById(id: string): Promise<Refund | null>;
  findByReturnRequestId(returnRequestId: string): Promise<Refund[]>;
  findByOrderId(orderId: string): Promise<Refund[]>;
  findAll(options?: RefundFilterOptions): Promise<Refund[]>;
  update(id: string, data: UpdateRefundData): Promise<Refund>;
  delete(id: string): Promise<void>;
}

