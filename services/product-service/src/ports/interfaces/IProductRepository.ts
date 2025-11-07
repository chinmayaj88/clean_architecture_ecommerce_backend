import { Product } from '../../core/entities/Product';

export interface IProductRepository {
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(filters?: {
    status?: string;
    isVisible?: boolean;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
    badges?: string[];
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity' | 'name';
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }>;
  
  /**
   * Search products with advanced filters
   */
  search(query: string, filters?: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
    badges?: string[];
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity' | 'relevance';
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }>;
  
  /**
   * Get product recommendations
   */
  getRecommendations(productId: string, limit?: number): Promise<Product[]>;
  
  /**
   * Get related products
   */
  getRelatedProducts(productId: string, categoryId?: string, limit?: number): Promise<Product[]>;
  
  /**
   * Increment view count
   */
  incrementViewCount(productId: string): Promise<void>;
  update(id: string, updates: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
}

