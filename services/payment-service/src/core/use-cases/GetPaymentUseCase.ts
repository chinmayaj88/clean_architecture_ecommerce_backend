import { IPaymentRepository } from '../../ports/interfaces/IPaymentRepository';
import { IPaymentTransactionRepository } from '../../ports/interfaces/IPaymentTransactionRepository';
import { IRefundRepository } from '../../ports/interfaces/IRefundRepository';
import { Payment } from '../../core/entities/Payment';
import { PaymentTransaction } from '../../core/entities/PaymentTransaction';
import { Refund } from '../../core/entities/Refund';

export interface PaymentDetails {
  payment: Payment;
  transactions: PaymentTransaction[];
  refunds: Refund[];
}

export class GetPaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentTransactionRepository: IPaymentTransactionRepository,
    private readonly refundRepository: IRefundRepository
  ) {}

  async execute(paymentId: string, userId?: string): Promise<PaymentDetails | null> {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      return null;
    }

    // Check if user has permission to view this payment
    if (userId && payment.userId !== userId) {
      throw new Error('Unauthorized to view this payment');
    }

    const transactions = await this.paymentTransactionRepository.findByPaymentId(paymentId);
    const refunds = await this.refundRepository.findByPaymentId(paymentId);

    return {
      payment,
      transactions,
      refunds,
    };
  }

  async executeByOrderId(orderId: string, userId?: string): Promise<PaymentDetails | null> {
    const payment = await this.paymentRepository.findByOrderId(orderId);

    if (!payment) {
      return null;
    }

    // Check if user has permission to view this payment
    if (userId && payment.userId !== userId) {
      throw new Error('Unauthorized to view this payment');
    }

    const transactions = await this.paymentTransactionRepository.findByPaymentId(payment.id);
    const refunds = await this.refundRepository.findByPaymentId(payment.id);

    return {
      payment,
      transactions,
      refunds,
    };
  }

  async executeByUserId(userId: string, status?: string) {
    return await this.paymentRepository.findByUserId(userId, status as any);
  }

  async executeByUserIdPaginated(
    userId: string,
    options?: {
      status?: string;
      paymentProvider?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'createdAt' | 'amount' | 'status';
      sortOrder?: 'asc' | 'desc';
      startDate?: Date;
      endDate?: Date;
      minAmount?: number;
      maxAmount?: number;
    }
  ) {
    return await this.paymentRepository.findByUserIdPaginated(userId, options as any);
  }
}

