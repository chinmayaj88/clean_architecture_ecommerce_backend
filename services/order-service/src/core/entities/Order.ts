export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export class Order {
  constructor(
    public id: string,
    public orderNumber: string,
    public userId: string,
    public status: OrderStatus,
    public paymentStatus: PaymentStatus,
    public subtotal: number,
    public taxAmount: number,
    public shippingAmount: number,
    public discountAmount: number,
    public totalAmount: number,
    public currency: string,
    public paymentMethodId: string | null,
    public shippingMethod: string | null,
    public trackingNumber: string | null,
    public estimatedDeliveryDate: Date | null,
    public shippedAt: Date | null,
    public deliveredAt: Date | null,
    public cancelledAt: Date | null,
    public metadata: Record<string, any> | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(data: any): Order {
    return new Order(
      data.id,
      data.orderNumber,
      data.userId,
      data.status as OrderStatus,
      data.paymentStatus as PaymentStatus,
      Number(data.subtotal),
      Number(data.taxAmount),
      Number(data.shippingAmount),
      Number(data.discountAmount),
      Number(data.totalAmount),
      data.currency,
      data.paymentMethodId,
      data.shippingMethod,
      data.trackingNumber,
      data.estimatedDeliveryDate,
      data.shippedAt,
      data.deliveredAt,
      data.cancelledAt,
      data.metadata as Record<string, any> | null,
      data.createdAt,
      data.updatedAt
    );
  }

  canBeCancelled(): boolean {
    return this.status === OrderStatus.PENDING || this.status === OrderStatus.CONFIRMED;
  }

  canBeRefunded(): boolean {
    return this.paymentStatus === PaymentStatus.PAID && 
           (this.status === OrderStatus.DELIVERED || this.status === OrderStatus.SHIPPED);
  }

  isCompleted(): boolean {
    return this.status === OrderStatus.DELIVERED || this.status === OrderStatus.CANCELLED || this.status === OrderStatus.REFUNDED;
  }

  requiresPayment(): boolean {
    return this.paymentStatus === PaymentStatus.PENDING;
  }
}

