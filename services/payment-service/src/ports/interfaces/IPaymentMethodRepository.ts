import { PaymentMethod, PaymentMethodType, PaymentProvider } from '../../core/entities/PaymentMethod';

export interface CreatePaymentMethodData {
  userId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  providerToken: string | null;
  last4: string | null;
  cardType: string | null;
  expiryMonth: string | null;
  expiryYear: string | null;
  isDefault: boolean;
}

export interface UpdatePaymentMethodData {
  isDefault?: boolean;
  providerToken?: string | null;
}

export interface IPaymentMethodRepository {
  create(method: CreatePaymentMethodData): Promise<PaymentMethod>;
  findById(id: string): Promise<PaymentMethod | null>;
  findByUserId(userId: string): Promise<PaymentMethod[]>;
  findDefaultByUserId(userId: string): Promise<PaymentMethod | null>;
  update(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod>;
  delete(id: string): Promise<void>;
  setDefault(userId: string, methodId: string): Promise<void>;
}

