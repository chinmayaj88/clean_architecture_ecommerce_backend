/**
 * RefreshToken Repository Interface - Port
 * Defines the contract for refresh token data access
 */

import { RefreshToken, CreateRefreshTokenData } from '../../core/entities/RefreshToken';

export interface IRefreshTokenRepository {
  /**
   * Create a new refresh token
   */
  create(data: CreateRefreshTokenData): Promise<RefreshToken>;

  /**
   * Find refresh token by token string
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Revoke a refresh token
   */
  revoke(token: string): Promise<void>;

  /**
   * Revoke all tokens for a user
   */
  revokeAllForUser(userId: string): Promise<void>;

  /**
   * Delete expired tokens
   */
  deleteExpired(): Promise<number>;
}

