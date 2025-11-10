import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';
import { PaymentMethod } from '../../core/entities/PaymentMethod';

export class GetPaymentMethodsUseCase {
  constructor(private readonly paymentMethodRepository: IPaymentMethodRepository) {}

  async execute(userId: string): Promise<PaymentMethod[]> {
    return await this.paymentMethodRepository.findByUserId(userId);
  }

  async executeDefault(userId: string): Promise<PaymentMethod | null> {
    return await this.paymentMethodRepository.findDefaultByUserId(userId);
  }
}

