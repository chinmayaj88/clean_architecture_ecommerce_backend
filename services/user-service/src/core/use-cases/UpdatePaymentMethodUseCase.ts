/**
 * Update Payment Method Use Case
 */

import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';
import { UpdatePaymentMethodData, PaymentMethod } from '../entities/PaymentMethod';

export class UpdatePaymentMethodUseCase {
  constructor(
    private readonly paymentMethodRepository: IPaymentMethodRepository
  ) {}

  async execute(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod> {
    return await this.paymentMethodRepository.update(id, data);
  }
}

