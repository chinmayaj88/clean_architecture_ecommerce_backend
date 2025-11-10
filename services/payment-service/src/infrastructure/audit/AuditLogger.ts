import { createLogger } from '../logging/logger';
import { PrismaClient } from '@prisma/client';

const logger = createLogger();

export enum AuditEventType {
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PAYMENT_METHOD_CREATED = 'PAYMENT_METHOD_CREATED',
  PAYMENT_METHOD_DELETED = 'PAYMENT_METHOD_DELETED',
  WEBHOOK_PROCESSED = 'WEBHOOK_PROCESSED',
  WEBHOOK_FAILED = 'WEBHOOK_FAILED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  REFUND_FAILED = 'REFUND_FAILED',
}

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success: boolean;
  error?: string;
}

export class AuditLogger {
  constructor(private readonly prisma?: PrismaClient) {}

  /**
   * Log audit event to database and logging service
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const auditData = {
      eventType: entry.eventType,
      userId: entry.userId || null,
      paymentId: entry.paymentId || null,
      orderId: entry.orderId || null,
      amount: entry.amount || null,
      currency: entry.currency || null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      metadata: entry.metadata || null,
      success: entry.success,
      error: entry.error || null,
      timestamp: new Date(),
    };

    // Log to database if Prisma client is available and audit log table exists
    // Note: Audit log table needs to be created via migration
    if (this.prisma) {
      try {
        // Use raw query to insert audit log (table may not exist in Prisma client yet)
        // This will work once migrations are run
        await (this.prisma as any).$executeRawUnsafe(
          `INSERT INTO audit_logs (id, "eventType", "userId", "paymentId", "orderId", amount, currency, "ipAddress", "userAgent", metadata, success, error, timestamp)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          auditData.eventType,
          auditData.userId,
          auditData.paymentId,
          auditData.orderId,
          auditData.amount?.toString(),
          auditData.currency,
          auditData.ipAddress,
          auditData.userAgent,
          auditData.metadata ? JSON.stringify(auditData.metadata) : null,
          auditData.success,
          auditData.error,
          auditData.timestamp
        );
      } catch (error) {
        // Don't fail the operation if audit logging fails (table may not exist yet)
        logger.error('Failed to write audit log to database', {
          error: error instanceof Error ? error.message : 'Unknown error',
          auditData,
        });
      }
    }

    // Also log to application logs
    const logLevel = entry.success ? 'info' : 'warn';
    logger[logLevel]('Audit log', {
      ...auditData,
      message: `Audit: ${entry.eventType} - ${entry.success ? 'SUCCESS' : 'FAILED'}`,
    });
  }

  /**
   * Log payment creation
   */
  async logPaymentCreated(params: {
    userId: string;
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      eventType: AuditEventType.PAYMENT_CREATED,
      userId: params.userId,
      paymentId: params.paymentId,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
      success: true,
    });
  }

  /**
   * Log payment processing
   */
  async logPaymentProcessed(params: {
    userId: string;
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    success: boolean;
    error?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      eventType: params.success ? AuditEventType.PAYMENT_PROCESSED : AuditEventType.PAYMENT_FAILED,
      userId: params.userId,
      paymentId: params.paymentId,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: params.success,
      error: params.error,
    });
  }

  /**
   * Log refund
   */
  async logRefund(params: {
    userId: string;
    paymentId: string;
    orderId: string;
    refundId: string;
    amount: number;
    currency: string;
    reason?: string;
    success: boolean;
    error?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const eventType = params.success
      ? AuditEventType.REFUND_COMPLETED
      : params.error
      ? AuditEventType.REFUND_FAILED
      : AuditEventType.REFUND_INITIATED;

    await this.log({
      eventType,
      userId: params.userId,
      paymentId: params.paymentId,
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        refundId: params.refundId,
        reason: params.reason,
      },
      success: params.success,
      error: params.error,
    });
  }

  /**
   * Log payment method creation
   */
  async logPaymentMethodCreated(params: {
    userId: string;
    paymentMethodId: string;
    type: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      eventType: AuditEventType.PAYMENT_METHOD_CREATED,
      userId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        paymentMethodId: params.paymentMethodId,
        type: params.type,
      },
      success: true,
    });
  }

  /**
   * Log webhook processing
   */
  async logWebhook(params: {
    provider: string;
    eventType: string;
    providerEventId: string;
    paymentId?: string;
    success: boolean;
    error?: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      eventType: params.success ? AuditEventType.WEBHOOK_PROCESSED : AuditEventType.WEBHOOK_FAILED,
      paymentId: params.paymentId,
      ipAddress: params.ipAddress,
      metadata: {
        provider: params.provider,
        eventType: params.eventType,
        providerEventId: params.providerEventId,
      },
      success: params.success,
      error: params.error,
    });
  }
}

// Singleton instance
let auditLogger: AuditLogger | null = null;

export function getAuditLogger(prisma?: PrismaClient): AuditLogger {
  if (!auditLogger) {
    auditLogger = new AuditLogger(prisma);
  }
  return auditLogger;
}

