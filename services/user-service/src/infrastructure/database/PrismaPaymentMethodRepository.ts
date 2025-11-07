/**
 * Prisma Payment Method Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';
import { PaymentMethod, CreatePaymentMethodData, UpdatePaymentMethodData } from '../../core/entities/PaymentMethod';

export class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: {
          userId: data.userId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        userId: data.userId,
        type: data.type,
        isDefault: data.isDefault ?? false,
        cardType: data.cardType,
        last4: data.last4,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cardholderName: data.cardholderName,
        billingAddressId: data.billingAddressId,
        providerToken: data.providerToken,
      },
    });

    return this.mapToEntity(paymentMethod);
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    return paymentMethod ? this.mapToEntity(paymentMethod) : null;
  }

  async findByUserId(userId: string): Promise<PaymentMethod[]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return paymentMethods.map((pm: any) => this.mapToEntity(pm));
  }

  async findDefaultByUserId(userId: string): Promise<PaymentMethod | null> {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    return paymentMethod ? this.mapToEntity(paymentMethod) : null;
  }

  async update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod> {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      const paymentMethod = await this.prisma.paymentMethod.findUnique({ where: { id } });
      if (paymentMethod) {
        await this.prisma.paymentMethod.updateMany({
          where: {
            userId: paymentMethod.userId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }
    }

    const paymentMethod = await this.prisma.paymentMethod.update({
      where: { id },
      data: {
        isDefault: data.isDefault,
        billingAddressId: data.billingAddressId,
        cardholderName: data.cardholderName,
      },
    });

    return this.mapToEntity(paymentMethod);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.paymentMethod.delete({
      where: { id },
    });
  }

  async setAsDefault(userId: string, paymentMethodId: string): Promise<void> {
    // Unset other defaults
    await this.prisma.paymentMethod.updateMany({
      where: {
        userId,
        isDefault: true,
        id: { not: paymentMethodId },
      },
      data: { isDefault: false },
    });

    // Set this as default
    await this.prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
    });
  }

  private mapToEntity(paymentMethod: {
    id: string;
    userId: string;
    type: string;
    isDefault: boolean;
    cardType: string | null;
    last4: string | null;
    expiryMonth: string | null;
    expiryYear: string | null;
    cardholderName: string | null;
    billingAddressId: string | null;
    providerToken: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentMethod {
    return {
      id: paymentMethod.id,
      userId: paymentMethod.userId,
      type: paymentMethod.type as 'credit_card' | 'debit_card' | 'paypal' | 'bank_account',
      isDefault: paymentMethod.isDefault,
      cardType: paymentMethod.cardType ?? undefined,
      last4: paymentMethod.last4 ?? undefined,
      expiryMonth: paymentMethod.expiryMonth ?? undefined,
      expiryYear: paymentMethod.expiryYear ?? undefined,
      cardholderName: paymentMethod.cardholderName ?? undefined,
      billingAddressId: paymentMethod.billingAddressId ?? undefined,
      providerToken: paymentMethod.providerToken ?? undefined,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt,
    };
  }
}

