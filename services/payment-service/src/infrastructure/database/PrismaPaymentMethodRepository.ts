import { PrismaClient } from '@prisma/client';
import { IPaymentMethodRepository, CreatePaymentMethodData, UpdatePaymentMethodData } from '../../ports/interfaces/IPaymentMethodRepository';
import { PaymentMethod } from '../../core/entities/PaymentMethod';
import { getEncryptionService } from '../encryption/EncryptionService';

export class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
  private encryptionService = getEncryptionService();

  constructor(private readonly prisma: PrismaClient) {}

  async create(method: CreatePaymentMethodData): Promise<PaymentMethod> {
    // If this is set as default, unset other default methods
    if (method.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId: method.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Encrypt provider token before storing
    const encryptedToken = method.providerToken
      ? this.encryptionService.encrypt(method.providerToken)
      : null;

    const created = await this.prisma.paymentMethod.create({
      data: {
        userId: method.userId,
        type: method.type,
        provider: method.provider,
        providerToken: encryptedToken,
        last4: method.last4,
        cardType: method.cardType,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        isDefault: method.isDefault,
      },
    });

    return PaymentMethod.fromPrisma(created);
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!method) {
      return null;
    }

    // Decrypt provider token when retrieving (for payment processing)
    // Note: In production, consider returning decrypted token only when needed
    const decryptedMethod = {
      ...method,
      providerToken: method.providerToken
        ? this.encryptionService.decrypt(method.providerToken)
        : null,
    };

    return PaymentMethod.fromPrisma(decryptedMethod);
  }

  async findByUserId(userId: string): Promise<PaymentMethod[]> {
    const methods = await this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    // Return methods without decrypting tokens (security)
    // PaymentMethod entity will handle the encrypted token appropriately
    // When payment processing needs the token, use findById or findDefaultByUserId
    return methods.map((method: any) => PaymentMethod.fromPrisma(method));
  }

  async findDefaultByUserId(userId: string): Promise<PaymentMethod | null> {
    const method = await this.prisma.paymentMethod.findFirst({
      where: { userId, isDefault: true },
    });

    if (!method) {
      return null;
    }

    // Decrypt token for default payment method (needed for processing)
    const decryptedMethod = {
      ...method,
      providerToken: method.providerToken
        ? this.encryptionService.decrypt(method.providerToken)
        : null,
    };

    return PaymentMethod.fromPrisma(decryptedMethod);
  }

  async update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod> {
    const method = await this.findById(id);
    if (!method) {
      throw new Error('Payment method not found');
    }

    // If setting as default, unset other default methods
    if (data.isDefault === true) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId: method.userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.providerToken !== undefined) {
      // Encrypt token before updating
      updateData.providerToken = data.providerToken
        ? this.encryptionService.encrypt(data.providerToken)
        : null;
    }

    const updated = await this.prisma.paymentMethod.update({
      where: { id },
      data: updateData,
    });

    return PaymentMethod.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.paymentMethod.delete({
      where: { id },
    });
  }

  async setDefault(userId: string, methodId: string): Promise<void> {
    // Unset all default methods for user
    await this.prisma.paymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set the specified method as default
    await this.prisma.paymentMethod.update({
      where: { id: methodId },
      data: { isDefault: true },
    });
  }
}

