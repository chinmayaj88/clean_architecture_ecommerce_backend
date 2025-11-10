import axios, { AxiosInstance } from 'axios';
import { IOrderServiceClient, OrderInfo, UpdateOrderPaymentStatusRequest } from '../../ports/interfaces/IOrderServiceClient';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';
import { retry } from '../utils/retry.util';
import { getCircuitBreaker } from '../utils/circuitBreaker.util';

const logger = createLogger();
const config = getEnvConfig();
const circuitBreaker = getCircuitBreaker('order-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 60000,
});

export class OrderServiceClient implements IOrderServiceClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.ORDER_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getOrder(orderId: string, token?: string): Promise<OrderInfo | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await circuitBreaker.execute(() =>
        retry(
          () => this.axiosInstance.get(`/api/v1/orders/${orderId}`, { headers }),
          { maxRetries: 3, retryDelay: 1000 }
        )
      );

      if (response.data.success && response.data.data) {
        const order = response.data.data.order || response.data.data;
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          totalAmount: Number(order.totalAmount),
          currency: order.currency,
          status: order.status,
          paymentStatus: order.paymentStatus,
        };
      }

      return null;
    } catch (error: unknown) {
      logger.warn(`Failed to fetch order ${orderId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.response?.status,
      });
      return null;
    }
  }

  async updatePaymentStatus(request: UpdateOrderPaymentStatusRequest, token?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await circuitBreaker.execute(() =>
        retry(
          () => this.axiosInstance.patch(
            `/api/v1/orders/${request.orderId}/payment-status`,
            {
              paymentStatus: request.paymentStatus,
              reason: request.reason,
            },
            { headers }
          ),
          { maxRetries: 3, retryDelay: 1000 }
        )
      );

      logger.info(`Updated payment status for order ${request.orderId}`, {
        paymentStatus: request.paymentStatus,
      });
    } catch (error: unknown) {
      logger.error(`Failed to update payment status for order ${request.orderId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.response?.status,
      });
      throw error;
    }
  }
}

