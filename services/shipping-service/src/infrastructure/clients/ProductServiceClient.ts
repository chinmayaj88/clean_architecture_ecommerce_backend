import axios, { AxiosInstance, AxiosError } from 'axios';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';
import { retry } from '../utils/retry.util';
import { getCircuitBreaker } from '../utils/circuitBreaker.util';

const logger = createLogger();
const config = getEnvConfig();
const circuitBreaker = getCircuitBreaker('product-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 60000,
});

export interface Product {
  id: string;
  name: string;
  weight?: number; // in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isActive: boolean;
}

export interface IProductServiceClient {
  getProduct(productId: string): Promise<Product | null>;
  getProducts(productIds: string[]): Promise<Product[]>;
}

export class ProductServiceClient implements IProductServiceClient {
  private axiosInstance: AxiosInstance;
  private cache: Map<string, { data: Product; expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.PRODUCT_SERVICE_URL || 'http://localhost:3003',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.PRODUCT_SERVICE_API_KEY && {
          'X-API-Key': config.PRODUCT_SERVICE_API_KEY,
        }),
        ...(config.PRODUCT_SERVICE_INTERNAL_TOKEN && {
          'X-Internal-Token': config.PRODUCT_SERVICE_INTERNAL_TOKEN,
        }),
      },
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response && error.response.status === 404) {
          logger.warn('Product not found', { productId: error.config?.url });
        } else if (error.response && error.response.status >= 500) {
          logger.error('Product service error', {
            status: error.response.status,
            url: error.config?.url,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  async getProduct(productId: string): Promise<Product | null> {
    try {
      const cached = this.cache.get(productId);
      if (cached && cached.expiresAt > Date.now()) {
        logger.debug('Product info retrieved from cache', { productId });
        return cached.data;
      }

      const response = await circuitBreaker.execute(() =>
        retry(
          async () => {
            return await this.axiosInstance.get(`/api/v1/products/${productId}`, {
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
        const productData = response.data.data;
        const product: Product = {
          id: productData.id || productId,
          name: productData.name,
          weight: productData.weight,
          dimensions: productData.dimensions,
          isActive: productData.isActive !== false,
        };

        this.cache.set(productId, {
          data: product,
          expiresAt: Date.now() + this.CACHE_TTL_MS,
        });

        return product;
      }

      return null;
    } catch (error: any) {
      if (error.message?.includes('Circuit breaker')) {
        logger.warn('Product service circuit breaker is open', { productId });
        const cached = this.cache.get(productId);
        if (cached) {
          return cached.data;
        }
        return null;
      }

      if (error.response && error.response.status === 404) {
        logger.warn('Product not found in product service', { productId });
        return null;
      }

      logger.error('Failed to fetch product from product service', {
        productId,
        error: error.message,
        status: error.response?.status,
      });

      const cached = this.cache.get(productId);
      if (cached) {
        return cached.data;
      }

      return null;
    }
  }

  async getProducts(productIds: string[]): Promise<Product[]> {
    const products = await Promise.all(
      productIds.map(id => this.getProduct(id))
    );
    return products.filter((p): p is Product => p !== null);
  }

  clearCache(productId?: string): void {
    if (productId) {
      this.cache.delete(productId);
    } else {
      this.cache.clear();
    }
  }
}

