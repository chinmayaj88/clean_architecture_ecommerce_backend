/**
 * Payment Method Repository Interface - Port
 */

import { PaymentMethod, CreatePaymentMethodData, UpdatePaymentMethodData } from '../../core/entities/PaymentMethod';

export interface IPaymentMethodRepository {
  create(data: CreatePaymentMethodData): Promise<PaymentMethod>;
  findById(id: string): Promise<PaymentMethod | null>;
  findByUserId(userId: string): Promise<PaymentMethod[]>;
  findDefaultByUserId(userId: string): Promise<PaymentMethod | null>;
  update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod>;
  delete(id: string): Promise<void>;
  setAsDefault(userId: string, paymentMethodId: string): Promise<void>;
}

