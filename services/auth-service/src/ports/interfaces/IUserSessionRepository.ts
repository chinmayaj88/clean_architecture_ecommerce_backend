/**
 * User Session Repository Interface
 * Defines contract for session data access
 */

import { UserSession, CreateUserSessionData } from '../../core/entities/UserSession';

export interface IUserSessionRepository {
  /**
   * Create a new session
   */
  create(data: CreateUserSessionData): Promise<UserSession>;

  /**
   * Find session by token
   */
  findByToken(sessionToken: string): Promise<UserSession | null>;

  /**
   * Find session by ID
   */
  findById(id: string): Promise<UserSession | null>;

  /**
   * Find all active sessions for a user
   */
  findActiveByUserId(userId: string): Promise<UserSession[]>;

  /**
   * Find all sessions for a user (including inactive)
   */
  findByUserId(userId: string): Promise<UserSession[]>;

  /**
   * Update session
   */
  update(id: string, updates: Partial<UserSession>): Promise<UserSession>;

  /**
   * Update last activity timestamp
   */
  updateLastActivity(sessionToken: string): Promise<void>;

  /**
   * Revoke session
   */
  revoke(id: string): Promise<void>;

  /**
   * Revoke all sessions for a user
   */
  revokeAllByUserId(userId: string): Promise<void>;

  /**
   * Revoke all sessions except current
   */
  revokeOthersByUserId(userId: string, currentSessionToken: string): Promise<void>;

  /**
   * Clean up expired sessions
   */
  cleanupExpired(): Promise<number>;
}

