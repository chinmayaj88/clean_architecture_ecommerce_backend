/**
 * Stock Alert Repository Interface
 */

import { StockAlert, CreateStockAlertData } from '../../core/entities/StockAlert';

export interface IStockAlertRepository {
  /**
   * Create a stock alert
   */
  create(data: CreateStockAlertData): Promise<StockAlert>;

  /**
   * Find alert by ID
   */
  findById(id: string): Promise<StockAlert | null>;

  /**
   * Find alerts for a product
   */
  findByProductId(productId: string, variantId?: string): Promise<StockAlert[]>;

  /**
   * Find alerts for a user
   */
  findByUserId(userId: string): Promise<StockAlert[]>;

  /**
   * Find un-notified alerts for a product
   */
  findUnnotifiedByProductId(productId: string, variantId?: string): Promise<StockAlert[]>;

  /**
   * Mark alert as notified
   */
  markAsNotified(id: string): Promise<void>;

  /**
   * Delete alert
   */
  delete(id: string): Promise<void>;

  /**
   * Delete expired alerts
   */
  deleteExpired(): Promise<number>;
}

