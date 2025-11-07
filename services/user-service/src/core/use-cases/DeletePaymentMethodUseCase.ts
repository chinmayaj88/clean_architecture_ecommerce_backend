/**
 * Delete Payment Method Use Case
 */

import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';

export class DeletePaymentMethodUseCase {
  constructor(
    private readonly paymentMethodRepository: IPaymentMethodRepository
  ) {}

  async execute(id: string): Promise<void> {
    await this.paymentMethodRepository.delete(id);
  }
}

