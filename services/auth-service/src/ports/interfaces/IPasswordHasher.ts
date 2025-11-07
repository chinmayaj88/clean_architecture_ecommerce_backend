/**
 * Password Hasher Interface - Port
 * Defines the contract for password hashing
 * Allows swapping implementations (bcrypt, argon2, etc.)
 */

export interface IPasswordHasher {
  /**
   * Hash a password
   * @param password - Plain text password
   * @returns Hashed password
   */
  hash(password: string): Promise<string>;

  /**
   * Compare password with hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns True if password matches
   */
  compare(password: string, hash: string): Promise<boolean>;
}

