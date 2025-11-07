/**
 * Product Comparison Entity
 */

export interface ProductComparison {
  id: string;
  userId: string;
  name?: string | null;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductComparisonData {
  userId: string;
  name?: string;
  productIds: string[];
}

