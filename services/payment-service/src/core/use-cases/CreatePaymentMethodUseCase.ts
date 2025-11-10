import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';
import { PaymentMethod, PaymentMethodType, PaymentProvider } from '../../core/entities/PaymentMethod';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface CreatePaymentMethodInput {
  userId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  providerToken: string | null;
  last4?: string | null;
  cardType?: string | null;
  expiryMonth?: string | null;
  expiryYear?: string | null;
  isDefault?: boolean;
}

export class CreatePaymentMethodUseCase {
  constructor(private readonly paymentMethodRepository: IPaymentMethodRepository) {}

  async execute(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.create({
      userId: input.userId,
      type: input.type,
      provider: input.provider,
      providerToken: input.providerToken,
      last4: input.last4 || null,
      cardType: input.cardType || null,
      expiryMonth: input.expiryMonth || null,
      expiryYear: input.expiryYear || null,
      isDefault: input.isDefault || false,
    });

    logger.info('Payment method created', {
      paymentMethodId: paymentMethod.id,
      userId: input.userId,
      type: input.type,
    });

    return paymentMethod;
  }
}

