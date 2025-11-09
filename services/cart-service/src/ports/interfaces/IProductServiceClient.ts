export interface ProductInfo {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl?: string | null;
  stock: number;
  status: string;
}

export interface ProductVariantInfo {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  name?: string | null;
}

export interface IProductServiceClient {
  getProduct(productId: string): Promise<ProductInfo | null>;
  getProductVariant(variantId: string): Promise<ProductVariantInfo | null>;
  validateProductAvailability(productId: string, variantId: string | null, quantity: number): Promise<boolean>;
}

