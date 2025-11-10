import { PrismaClient } from '@prisma/client';
import { IPaymentTransactionRepository, CreatePaymentTransactionData } from '../../ports/interfaces/IPaymentTransactionRepository';
import { PaymentTransaction, TransactionStatus } from '../../core/entities/PaymentTransaction';

export class PrismaPaymentTransactionRepository implements IPaymentTransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(transaction: CreatePaymentTransactionData): Promise<PaymentTransaction> {
    const created = await this.prisma.paymentTransaction.create({
      data: {
        paymentId: transaction.paymentId,
        transactionType: transaction.transactionType,
        status: transaction.status,
        providerTransactionId: transaction.providerTransactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        providerResponse: transaction.providerResponse || undefined,
      },
    });

    return PaymentTransaction.fromPrisma(created);
  }

  async findById(id: string): Promise<PaymentTransaction | null> {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return null;
    }

    return PaymentTransaction.fromPrisma(transaction);
  }

  async findByPaymentId(paymentId: string): Promise<PaymentTransaction[]> {
    const transactions = await this.prisma.paymentTransaction.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((transaction: any) => PaymentTransaction.fromPrisma(transaction));
  }

  async update(id: string, status: TransactionStatus, processedAt: Date | null, providerResponse?: Record<string, any> | null): Promise<PaymentTransaction> {
    const updateData: any = {
      status,
      processedAt,
    };
    if (providerResponse !== undefined) {
      updateData.providerResponse = providerResponse || undefined;
    }

    const updated = await this.prisma.paymentTransaction.update({
      where: { id },
      data: updateData,
    });

    return PaymentTransaction.fromPrisma(updated);
  }
}

