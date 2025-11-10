export interface OrderInfo {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
}

export interface UpdateOrderPaymentStatusRequest {
  orderId: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  reason?: string | null;
}

export interface IOrderServiceClient {
  getOrder(orderId: string, token?: string): Promise<OrderInfo | null>;
  updatePaymentStatus(request: UpdateOrderPaymentStatusRequest, token?: string): Promise<void>;
}

