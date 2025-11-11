import axios, { AxiosInstance } from 'axios';
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

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  status: string;
  items?: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface IOrderServiceClient {
  getOrder(orderId: string): Promise<Order | null>;
}

export class OrderServiceClient implements IOrderServiceClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.ORDER_SERVICE_URL || 'http://localhost:3004',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.ORDER_SERVICE_API_KEY && {
          'X-API-Key': config.ORDER_SERVICE_API_KEY,
        }),
        ...(config.ORDER_SERVICE_INTERNAL_TOKEN && {
          'X-Internal-Token': config.ORDER_SERVICE_INTERNAL_TOKEN,
        }),
      },
    });
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const response = await circuitBreaker.execute(() =>
        retry(
          async () => {
            return await this.axiosInstance.get(`/api/v1/orders/${orderId}`);
          },
          {
            maxRetries: 2,
            retryDelay: 500,
            retryableErrors: [500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT'],
          }
        )
      );

      if (response.data && response.data.data) {
        return response.data.data as Order;
      }

      return null;
    } catch (error: any) {
      if (error.message?.includes('Circuit breaker')) {
        logger.warn('Order service circuit breaker is open', { orderId });
        return null;
      }

      if (error.response && error.response.status === 404) {
        logger.warn('Order not found in order service', { orderId });
        return null;
      }

      logger.error('Failed to fetch order from order service', {
        orderId,
        error: error.message,
        status: error.response?.status,
      });

      return null;
    }
  }
}

