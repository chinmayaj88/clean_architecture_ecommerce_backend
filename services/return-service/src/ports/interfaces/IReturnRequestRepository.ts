import { ReturnRequest, ReturnStatus } from '../../core/entities/ReturnRequest';

export interface CreateReturnRequestData {
  orderId: string;
  userId: string;
  rmaNumber: string;
  returnReason: string;
  returnNotes?: string | null;
  refundMethod: string;
  refundAmount: number;
  currency?: string;
  metadata?: Record<string, any> | null;
}

export interface UpdateReturnRequestData {
  status?: ReturnStatus;
  returnNotes?: string | null;
  refundAmount?: number;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  receivedAt?: Date | null;
  processedAt?: Date | null;
  closedAt?: Date | null;
  metadata?: Record<string, any> | null;
}

export interface ReturnRequestFilterOptions {
  userId?: string;
  orderId?: string;
  status?: ReturnStatus;
  rmaNumber?: string;
  limit?: number;
  offset?: number;
}

export interface IReturnRequestRepository {
  create(data: CreateReturnRequestData): Promise<ReturnRequest>;
  findById(id: string): Promise<ReturnRequest | null>;
  findByRmaNumber(rmaNumber: string): Promise<ReturnRequest | null>;
  findByOrderId(orderId: string): Promise<ReturnRequest[]>;
  findByUserId(userId: string, options?: ReturnRequestFilterOptions): Promise<ReturnRequest[]>;
  findAll(options?: ReturnRequestFilterOptions): Promise<ReturnRequest[]>;
  update(id: string, data: UpdateReturnRequestData): Promise<ReturnRequest>;
  delete(id: string): Promise<void>;
}

