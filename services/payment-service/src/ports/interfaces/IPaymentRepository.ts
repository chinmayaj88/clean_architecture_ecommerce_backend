import { Payment, PaymentStatus, PaymentProvider } from '../../core/entities/Payment';

export interface CreatePaymentData {
  orderId: string;
  userId: string;
  paymentMethodId: string | null;
  status: PaymentStatus;
  paymentProvider: PaymentProvider;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  description: string | null;
  metadata: Record<string, any> | null;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  providerPaymentId?: string | null;
  processedAt?: Date | null;
  metadata?: Record<string, any> | null;
}

export interface PaymentQueryOptions {
  status?: PaymentStatus;
  paymentProvider?: PaymentProvider;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginatedPayments {
  payments: Payment[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface IPaymentRepository {
  create(payment: CreatePaymentData): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByProviderPaymentId(providerPaymentId: string): Promise<Payment | null>;
  findByUserId(userId: string, status?: PaymentStatus): Promise<Payment[]>;
  findByUserIdPaginated(userId: string, options?: PaymentQueryOptions): Promise<PaginatedPayments>;
  update(id: string, data: UpdatePaymentData): Promise<Payment>;
  delete(id: string): Promise<void>;
}

