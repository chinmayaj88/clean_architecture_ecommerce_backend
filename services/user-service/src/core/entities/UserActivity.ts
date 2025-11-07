/**
 * User Activity Entity
 * Tracks all user actions for analytics
 */

export interface UserActivity {
  id: string;
  userId: string;
  activityType: string; // 'product_viewed', 'product_searched', 'wishlist_added', etc.
  entityType?: string | null; // 'product', 'order', 'address', etc.
  entityId?: string | null; // ID of the entity
  metadata?: Record<string, any> | null; // Additional activity data
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface CreateUserActivityData {
  userId: string;
  activityType: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

