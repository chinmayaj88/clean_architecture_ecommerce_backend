import { Refund, RefundStatus } from '../../core/entities/Refund';

export interface CreateRefundData {
  paymentId: string;
  orderId: string;
  reason: string | null;
  amount: number;
  currency: string;
  status: RefundStatus;
  providerRefundId: string | null;
  metadata: Record<string, any> | null;
}

export interface UpdateRefundData {
  status?: RefundStatus;
  providerRefundId?: string | null;
  processedAt?: Date | null;
  metadata?: Record<string, any> | null;
}

export interface IRefundRepository {
  create(refund: CreateRefundData): Promise<Refund>;
  findById(id: string): Promise<Refund | null>;
  findByPaymentId(paymentId: string): Promise<Refund[]>;
  findByOrderId(orderId: string): Promise<Refund[]>;
  update(id: string, data: UpdateRefundData): Promise<Refund>;
}

