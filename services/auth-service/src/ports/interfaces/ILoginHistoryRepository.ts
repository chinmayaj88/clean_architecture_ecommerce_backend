/**
 * Login History Repository Interface
 * Defines contract for login history data access
 */

import { LoginHistory, CreateLoginHistoryData } from '../../core/entities/LoginHistory';

export interface ILoginHistoryRepository {
  /**
   * Create login history entry
   */
  create(data: CreateLoginHistoryData): Promise<LoginHistory>;

  /**
   * Find login history for a user
   */
  findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: 'success' | 'failed' | 'blocked';
      isSuspicious?: boolean;
    }
  ): Promise<LoginHistory[]>;

  /**
   * Count login history for a user
   */
  countByUserId(
    userId: string,
    filters?: {
      status?: 'success' | 'failed' | 'blocked';
      isSuspicious?: boolean;
    }
  ): Promise<number>;

  /**
   * Find suspicious logins
   */
  findSuspiciousLogins(userId: string, limit?: number): Promise<LoginHistory[]>;

  /**
   * Get recent failed login attempts
   */
  getRecentFailedAttempts(userId: string, hours?: number): Promise<LoginHistory[]>;
}

