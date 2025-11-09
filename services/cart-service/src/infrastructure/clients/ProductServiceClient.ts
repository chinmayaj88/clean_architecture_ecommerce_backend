import axios, { AxiosInstance } from 'axios';
import { IProductServiceClient, ProductInfo, ProductVariantInfo } from '../../ports/interfaces/IProductServiceClient';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();
const config = getEnvConfig();

export class ProductServiceClient implements IProductServiceClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.PRODUCT_SERVICE_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getProduct(productId: string): Promise<ProductInfo | null> {
    try {
      const response = await this.axiosInstance.get(`/api/v1/products/${productId}`);
      
      if (response.data.success && response.data.data) {
        const product = response.data.data;
        return {
          id: product.id,
          name: product.name,
          sku: product.sku || productId,
          price: Number(product.price),
          imageUrl: product.images?.[0]?.url || null,
          stock: product.inventory?.quantity || 0,
          status: product.status || 'active',
        };
      }

      return null;
    } catch (error: any) {
      logger.warn(`Failed to fetch product ${productId}`, {
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  async getProductVariant(variantId: string): Promise<ProductVariantInfo | null> {
    try {
      // Note: This assumes the product service has a variant endpoint
      // If not, we might need to get the product and find the variant
      const response = await this.axiosInstance.get(`/api/v1/products/variants/${variantId}`);
      
      if (response.data.success && response.data.data) {
        const variant = response.data.data;
        return {
          id: variant.id,
          productId: variant.productId,
          sku: variant.sku || variantId,
          price: Number(variant.price),
          stock: variant.stock || 0,
          name: variant.name || null,
        };
      }

      return null;
    } catch (error: any) {
      logger.warn(`Failed to fetch product variant ${variantId}`, {
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  async validateProductAvailability(
    productId: string,
    variantId: string | null,
    quantity: number
  ): Promise<boolean> {
    try {
      if (variantId) {
        const variant = await this.getProductVariant(variantId);
        if (!variant) {
          return false;
        }
        return variant.stock >= quantity && variant.stock > 0;
      } else {
        const product = await this.getProduct(productId);
        if (!product) {
          return false;
        }
        return product.stock >= quantity && product.stock > 0;
      }
    } catch (error: any) {
      logger.error(`Failed to validate product availability`, {
        error: error.message,
        productId,
        variantId,
        quantity,
      });
      return false;
    }
  }
}

