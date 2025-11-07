/**
 * Create Payment Method Use Case
 */

import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';
import { CreatePaymentMethodData, PaymentMethod } from '../entities/PaymentMethod';

export class CreatePaymentMethodUseCase {
  constructor(
    private readonly paymentMethodRepository: IPaymentMethodRepository
  ) {}

  async execute(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    return await this.paymentMethodRepository.create(data);
  }
}

