import { PrismaClient } from '@prisma/client';
import { IPaymentRepository } from '../../ports/interfaces/IPaymentRepository';
import { IPaymentTransactionRepository } from '../../ports/interfaces/IPaymentTransactionRepository';
import { IOrderServiceClient } from '../../ports/interfaces/IOrderServiceClient';
import { Payment, PaymentStatus } from '../../core/entities/Payment';
import { TransactionType, TransactionStatus } from '../../core/entities/PaymentTransaction';
import { createPaymentProvider } from '../../infrastructure/providers/PaymentProviderFactory';
import { createLogger } from '../../infrastructure/logging/logger';
import { AppError } from '../../middleware/errorHandler.middleware';
import { PrismaIdempotencyRepository } from '../../infrastructure/database/PrismaIdempotencyRepository';
import { getAuditLogger } from '../../infrastructure/audit/AuditLogger';
import crypto from 'crypto';

const logger = createLogger();

export interface CreatePaymentInput {
  orderId: string;
  userId: string;
  paymentMethodId?: string | null;
  amount: number;
  currency?: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  token?: string;
  idempotencyKey?: string; // Idempotency key to prevent duplicate payments
}

export class CreatePaymentUseCase {
  private idempotencyRepository: PrismaIdempotencyRepository;
  private auditLogger = getAuditLogger();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentTransactionRepository: IPaymentTransactionRepository,
    private readonly orderServiceClient: IOrderServiceClient
  ) {
    this.idempotencyRepository = new PrismaIdempotencyRepository(prisma);
    this.auditLogger = getAuditLogger(prisma);
  }

  async execute(input: CreatePaymentInput, ipAddress?: string, userAgent?: string): Promise<Payment> {
    // 1. Handle idempotency key
    let idempotencyKey = input.idempotencyKey;
    if (!idempotencyKey) {
      // Generate idempotency key from request parameters if not provided
      idempotencyKey = this.generateIdempotencyKey(input);
    }

    // Check if payment already exists for this idempotency key
    const existingPaymentId = await this.idempotencyRepository.getPaymentId(idempotencyKey);
    if (existingPaymentId) {
      const existingPayment = await this.paymentRepository.findById(existingPaymentId);
      if (existingPayment) {
        logger.info('Payment creation idempotent - returning existing payment', {
          paymentId: existingPayment.id,
          idempotencyKey,
          orderId: input.orderId,
        });
        return existingPayment;
      }
    }

    // 2. Verify order exists and get order details
    const order = await this.orderServiceClient.getOrder(input.orderId, input.token);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    // 3. Verify user owns the order
    if (order.userId !== input.userId) {
      throw new AppError(403, 'Unauthorized to create payment for this order');
    }

    // 4. Check if payment already exists for this order
    const existingPayment = await this.paymentRepository.findByOrderId(input.orderId);
    if (existingPayment && existingPayment.status !== PaymentStatus.FAILED && existingPayment.status !== PaymentStatus.CANCELLED) {
      throw new AppError(409, 'Payment already exists for this order');
    }

    // 5. Verify amount matches order total
    if (Math.abs(input.amount - order.totalAmount) > 0.01) {
      throw new AppError(400, `Payment amount (${input.amount}) does not match order total (${order.totalAmount})`);
    }

    // 6. Get payment provider
    const paymentProvider = createPaymentProvider();

    // 7. Create payment record in database (transaction)
    const payment = await this.prisma.$transaction(async () => {
      const paymentData = {
        orderId: input.orderId,
        userId: input.userId,
        paymentMethodId: input.paymentMethodId || null,
        status: PaymentStatus.PENDING,
        paymentProvider: paymentProvider.getName(),
        providerPaymentId: null,
        amount: input.amount,
        currency: input.currency || order.currency,
        description: input.description || `Payment for order ${order.orderNumber}`,
        metadata: input.metadata || null,
      };

      const createdPayment = await this.paymentRepository.create(paymentData);

      // Store idempotency key
      await this.idempotencyRepository.store(idempotencyKey, createdPayment.id, input.userId, 24);

      // Create initial transaction record
      await this.paymentTransactionRepository.create({
        paymentId: createdPayment.id,
        transactionType: TransactionType.CHARGE,
        status: TransactionStatus.PENDING,
        providerTransactionId: null,
        amount: input.amount,
        currency: input.currency || order.currency,
        providerResponse: null,
      });

      return createdPayment;
    });

    // 8. Audit log
    await this.auditLogger.logPaymentCreated({
      userId: input.userId,
      paymentId: payment.id,
      orderId: input.orderId,
      amount: input.amount,
      currency: payment.currency,
      ipAddress,
      userAgent,
      metadata: input.metadata || undefined,
    });

    logger.info('Payment created', {
      paymentId: payment.id,
      orderId: input.orderId,
      userId: input.userId,
      amount: input.amount,
      idempotencyKey,
    });

    return payment;
  }

  /**
   * Generate idempotency key from request parameters
   */
  private generateIdempotencyKey(input: CreatePaymentInput): string {
    const data = `${input.userId}:${input.orderId}:${input.amount}:${input.paymentMethodId || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

