import { PaymentTransaction, TransactionType, TransactionStatus } from '../../core/entities/PaymentTransaction';

export interface CreatePaymentTransactionData {
  paymentId: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  providerTransactionId: string | null;
  amount: number;
  currency: string;
  providerResponse: Record<string, any> | null;
}

export interface IPaymentTransactionRepository {
  create(transaction: CreatePaymentTransactionData): Promise<PaymentTransaction>;
  findById(id: string): Promise<PaymentTransaction | null>;
  findByPaymentId(paymentId: string): Promise<PaymentTransaction[]>;
  update(id: string, status: TransactionStatus, processedAt: Date | null, providerResponse?: Record<string, any> | null): Promise<PaymentTransaction>;
}

