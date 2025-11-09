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
        // Note: Images are not included in the product response
        // Frontend can fetch images separately when displaying the cart
        
        return {
          id: product.id,
          name: product.name,
          sku: product.sku || productId,
          price: Number(product.price),
          imageUrl: null, // Images are fetched separately by frontend
          stock: product.stockQuantity || 0,
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
      // Get variant by ID directly
      const response = await this.axiosInstance.get(`/api/v1/products/variants/${variantId}`);
      
      if (response.data.success && response.data.data) {
        const variant = response.data.data;
        return {
          id: variant.id,
          productId: variant.productId,
          sku: variant.sku || variantId,
          price: variant.price ? Number(variant.price) : 0,
          stock: variant.stockQuantity || 0, // Variant has stockQuantity directly
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
        // Check if variant belongs to the product
        if (variant.productId !== productId) {
          return false;
        }
        return variant.stock >= quantity && variant.stock > 0;
      } else {
        const product = await this.getProduct(productId);
        if (!product) {
          return false;
        }
        // Also check product status
        if (product.status !== 'active') {
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

