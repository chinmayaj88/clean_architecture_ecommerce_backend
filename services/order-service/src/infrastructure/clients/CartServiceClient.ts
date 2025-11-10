import axios, { AxiosInstance } from 'axios';
import { ICartServiceClient, CartInfo } from '../../ports/interfaces/ICartServiceClient';
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

export class CartServiceClient implements ICartServiceClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.CART_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getCart(cartId: string, token?: string): Promise<CartInfo | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await circuitBreaker.execute(() =>
        retry(
          () => this.axiosInstance.get(`/api/v1/carts/${cartId}`, { headers }),
          { maxRetries: 3, retryDelay: 1000 }
        )
      );

      if (response.data.success && response.data.data) {
        const cart = response.data.data;
        return {
          id: cart.id,
          userId: cart.userId,
          items: cart.items?.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            productSku: item.productSku,
            productImageUrl: item.productImageUrl,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            totalPrice: Number(item.totalPrice),
          })) || [],
          subtotal: Number(cart.subtotal),
          taxAmount: Number(cart.taxAmount),
          shippingAmount: Number(cart.shippingAmount),
          discountAmount: Number(cart.discountAmount),
          totalAmount: Number(cart.totalAmount),
          currency: cart.currency || 'USD',
        };
      }

      return null;
    } catch (error: any) {
      logger.warn(`Failed to fetch cart ${cartId}`, {
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  async getCartByUserId(userId: string, token?: string): Promise<CartInfo | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await circuitBreaker.execute(() =>
        retry(
          () => this.axiosInstance.get(`/api/v1/carts`, { headers }),
          { maxRetries: 3, retryDelay: 1000 }
        )
      );

      if (response.data.success && response.data.data) {
        const cart = response.data.data;
        return {
          id: cart.id,
          userId: cart.userId,
          items: cart.items?.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            productSku: item.productSku,
            productImageUrl: item.productImageUrl,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            totalPrice: Number(item.totalPrice),
          })) || [],
          subtotal: Number(cart.subtotal),
          taxAmount: Number(cart.taxAmount),
          shippingAmount: Number(cart.shippingAmount),
          discountAmount: Number(cart.discountAmount),
          totalAmount: Number(cart.totalAmount),
          currency: cart.currency || 'USD',
        };
      }

      return null;
    } catch (error: any) {
      logger.warn(`Failed to fetch cart for user ${userId}`, {
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  async markCartAsConverted(cartId: string, orderId: string, token?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Note: This endpoint may need to be implemented in Cart Service
      // For now, we'll just log it
      logger.info(`Cart ${cartId} converted to order ${orderId}`);
    } catch (error: any) {
      logger.warn(`Failed to mark cart ${cartId} as converted`, {
        error: error.message,
        status: error.response?.status,
      });
    }
  }
}

