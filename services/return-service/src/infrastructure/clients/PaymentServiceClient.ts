import axios, { AxiosInstance } from 'axios';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';
import { retry } from '../utils/retry.util';
import { getCircuitBreaker } from '../utils/circuitBreaker.util';

const logger = createLogger();
const config = getEnvConfig();
const circuitBreaker = getCircuitBreaker('payment-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 60000,
});

export interface ProcessRefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
}

export interface IPaymentServiceClient {
  processRefund(request: ProcessRefundRequest): Promise<{ id: string; status: string } | null>;
}

export class PaymentServiceClient implements IPaymentServiceClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.PAYMENT_SERVICE_URL || 'http://localhost:3005',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.PAYMENT_SERVICE_API_KEY && {
          'X-API-Key': config.PAYMENT_SERVICE_API_KEY,
        }),
        ...(config.PAYMENT_SERVICE_INTERNAL_TOKEN && {
          'X-Internal-Token': config.PAYMENT_SERVICE_INTERNAL_TOKEN,
        }),
      },
    });
  }

  async processRefund(request: ProcessRefundRequest): Promise<{ id: string; status: string } | null> {
    try {
      const response = await circuitBreaker.execute(() =>
        retry(
          async () => {
            return await this.axiosInstance.post('/api/v1/refunds', request);
          },
          {
            maxRetries: 2,
            retryDelay: 500,
            retryableErrors: [500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT'],
          }
        )
      );

      if (response.data && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      if (error.message?.includes('Circuit breaker')) {
        logger.warn('Payment service circuit breaker is open', { paymentId: request.paymentId });
        return null;
      }

      logger.error('Failed to process refund via payment service', {
        paymentId: request.paymentId,
        error: error.message,
        status: error.response?.status,
      });

      return null;
    }
  }
}

