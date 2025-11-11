import axios, { AxiosInstance, AxiosError } from 'axios';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';
import { retry } from '../utils/retry.util';
import { getCircuitBreaker } from '../utils/circuitBreaker.util';

const logger = createLogger();
const config = getEnvConfig();
const circuitBreaker = getCircuitBreaker('cart-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 60000,
});

export interface Cart {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string | null;
  items: CartItem[];
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ICartServiceClient {
  getCart(cartId: string): Promise<Cart | null>;
  updateCartDiscount(cartId: string, discountAmount: number, couponCode?: string): Promise<Cart | null>;
}

export class CartServiceClient implements ICartServiceClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.CART_SERVICE_URL || 'http://localhost:3006',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.CART_SERVICE_API_KEY && {
          'X-API-Key': config.CART_SERVICE_API_KEY,
        }),
        ...(config.CART_SERVICE_INTERNAL_TOKEN && {
          'X-Internal-Token': config.CART_SERVICE_INTERNAL_TOKEN,
        }),
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response && error.response.status === 404) {
          logger.warn('Cart not found', { cartId: error.config?.url });
        } else if (error.response && error.response.status >= 500) {
          logger.error('Cart service error', {
            status: error.response.status,
            url: error.config?.url,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  async getCart(cartId: string): Promise<Cart | null> {
    try {
      const response = await circuitBreaker.execute(() =>
        retry(
          async () => {
            return await this.axiosInstance.get(`/api/v1/carts/${cartId}`, {
              timeout: 5000,
            });
          },
          {
            maxRetries: 2,
            retryDelay: 500,
            retryableErrors: [500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT'],
          }
        )
      );

      if (response.data && response.data.data) {
        return response.data.data as Cart;
      }

      return null;
    } catch (error: any) {
      if (error.message?.includes('Circuit breaker')) {
        logger.warn('Cart service circuit breaker is open', { cartId });
        return null;
      }

      if (error.response && error.response.status === 404) {
        logger.warn('Cart not found in cart service', { cartId });
        return null;
      }

      logger.error('Failed to fetch cart from cart service', {
        cartId,
        error: error.message,
        status: error.response?.status,
      });

      return null;
    }
  }

  async updateCartDiscount(cartId: string, discountAmount: number, couponCode?: string): Promise<Cart | null> {
    try {
      const response = await circuitBreaker.execute(() =>
        retry(
          async () => {
            return await this.axiosInstance.patch(`/api/v1/carts/${cartId}`, {
              discountAmount,
              couponCode,
            }, {
              timeout: 5000,
            });
          },
          {
            maxRetries: 2,
            retryDelay: 500,
            retryableErrors: [500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT'],
          }
        )
      );

      if (response.data && response.data.data) {
        return response.data.data as Cart;
      }

      return null;
    } catch (error: any) {
      if (error.message?.includes('Circuit breaker')) {
        logger.warn('Cart service circuit breaker is open', { cartId });
        return null;
      }

      logger.error('Failed to update cart discount', {
        cartId,
        error: error.message,
        status: error.response?.status,
      });

      return null;
    }
  }
}

