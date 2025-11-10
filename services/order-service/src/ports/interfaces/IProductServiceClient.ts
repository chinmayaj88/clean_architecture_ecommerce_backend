export interface ProductInfo {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: string;
  imageUrl?: string | null;
}

export interface ProductVariantInfo {
  id: string;
  productId: string;
  name: string | null;
  sku: string;
  price: number;
  stock: number;
}

export interface IProductServiceClient {
  getProduct(productId: string): Promise<ProductInfo | null>;
  getProductVariant(variantId: string): Promise<ProductVariantInfo | null>;
  validateProductAvailability(productId: string, variantId: string | null, quantity: number): Promise<boolean>;
  reserveInventory(productId: string, variantId: string | null, quantity: number): Promise<boolean>;
}

