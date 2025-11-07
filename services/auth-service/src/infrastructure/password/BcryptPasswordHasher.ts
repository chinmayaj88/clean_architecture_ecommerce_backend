/**
 * Bcrypt Password Hasher Implementation
 * Uses bcryptjs for password hashing
 *
 * Time Complexity: O(2^cost) where cost is the salt rounds
 * Space Complexity: O(1) - constant space
 *
 * Security: Uses bcrypt with 12 salt rounds by default
 * This provides good security while maintaining reasonable performance
 * (~100-300ms per hash on modern hardware)
 */

import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../ports/interfaces/IPasswordHasher';

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements IPasswordHasher {
  /**
   * Hash a password using bcrypt
   * Time: O(2^12) = ~4096 iterations
   * Space: O(1)
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   * Time: O(2^12) = ~4096 iterations
   * Space: O(1)
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

