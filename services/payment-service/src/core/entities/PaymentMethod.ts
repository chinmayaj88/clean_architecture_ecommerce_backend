export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MOCK = 'MOCK',
}

export class PaymentMethod {
  constructor(
    public id: string,
    public userId: string,
    public type: PaymentMethodType,
    public provider: PaymentProvider,
    public providerToken: string | null,
    public last4: string | null,
    public cardType: string | null,
    public expiryMonth: string | null,
    public expiryYear: string | null,
    public isDefault: boolean,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): PaymentMethod {
    return new PaymentMethod(
      data.id,
      data.userId,
      data.type as PaymentMethodType,
      data.provider as PaymentProvider,
      data.providerToken,
      data.last4,
      data.cardType,
      data.expiryMonth,
      data.expiryYear,
      data.isDefault,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Return a safe version of the payment method for API responses
   * Masks sensitive data like provider tokens
   */
  toSafeJSON(): {
    id: string;
    userId: string;
    type: PaymentMethodType;
    provider: PaymentProvider;
    providerToken: null;
    last4: string | null;
    cardType: string | null;
    expiryMonth: string | null;
    expiryYear: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      provider: this.provider,
      providerToken: null, // Never expose tokens in API responses
      last4: this.last4,
      cardType: this.cardType,
      expiryMonth: this.expiryMonth,
      expiryYear: this.expiryYear,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

