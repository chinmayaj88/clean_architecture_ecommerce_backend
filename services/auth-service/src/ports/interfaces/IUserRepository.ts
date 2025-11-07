/**
 * User Repository Interface - Port
 * Defines the contract for user data access
 * Implementations can use Prisma, MongoDB, etc.
 */

import { User, UserWithRoles, CreateUserData } from '../../core/entities/User';

export interface IUserRepository {
  /**
   * Create a new user
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by email with roles
   */
  findByEmailWithRoles(email: string): Promise<UserWithRoles | null>;

  /**
   * Update user
   */
  update(id: string, data: Partial<User>): Promise<User>;

  /**
   * Delete user (soft delete by setting isActive = false)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Increment failed login attempts
   */
  incrementFailedLoginAttempts(userId: string): Promise<void>;

  /**
   * Reset failed login attempts and unlock account
   */
  resetFailedLoginAttempts(userId: string): Promise<void>;

  /**
   * Lock account until specified time
   */
  lockAccount(userId: string, lockedUntil: Date): Promise<void>;
}

