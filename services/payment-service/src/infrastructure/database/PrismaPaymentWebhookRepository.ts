import { PrismaClient } from '@prisma/client';
import { IPaymentWebhookRepository, CreatePaymentWebhookData } from '../../ports/interfaces/IPaymentWebhookRepository';
import { PaymentWebhook, WebhookStatus } from '../../core/entities/PaymentWebhook';

export class PrismaPaymentWebhookRepository implements IPaymentWebhookRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(webhook: CreatePaymentWebhookData): Promise<PaymentWebhook> {
    const created = await this.prisma.paymentWebhook.create({
      data: {
        provider: webhook.provider,
        eventType: webhook.eventType,
        providerEventId: webhook.providerEventId,
        payload: webhook.payload,
        status: webhook.status,
        error: webhook.error || null,
        paymentId: webhook.paymentId || null,
      },
    });

    return PaymentWebhook.fromPrisma(created);
  }

  async findById(id: string): Promise<PaymentWebhook | null> {
    const webhook = await this.prisma.paymentWebhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      return null;
    }

    return PaymentWebhook.fromPrisma(webhook);
  }

  async findByProviderEventId(providerEventId: string): Promise<PaymentWebhook | null> {
    const webhook = await this.prisma.paymentWebhook.findUnique({
      where: { providerEventId },
    });

    if (!webhook) {
      return null;
    }

    return PaymentWebhook.fromPrisma(webhook);
  }

  async findByStatus(status: WebhookStatus, limit: number = 100): Promise<PaymentWebhook[]> {
    const webhooks = await this.prisma.paymentWebhook.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return webhooks.map((webhook: any) => PaymentWebhook.fromPrisma(webhook));
  }

  async update(id: string, status: WebhookStatus, error: string | null, processedAt: Date | null): Promise<PaymentWebhook> {
    const updated = await this.prisma.paymentWebhook.update({
      where: { id },
      data: {
        status,
        error,
        processedAt,
      },
    });

    return PaymentWebhook.fromPrisma(updated);
  }
}

