import crypto from 'crypto';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();
const config = getEnvConfig();

/**
 * Encryption service for sensitive payment data (PCI compliance)
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private iterations = 100000; // PBKDF2 iterations

  /**
   * Get encryption key from environment or derive from JWT_SECRET
   * In production, use a proper key management service (AWS KMS, HashiCorp Vault)
   */
  private getEncryptionKey(): Buffer {
    // In production, retrieve from key management service
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (encryptionKey) {
      // If key is provided, use it directly (must be 32 bytes for AES-256)
      if (encryptionKey.length === 64) { // Hex encoded
        return Buffer.from(encryptionKey, 'hex');
      }
      // Derive key from provided secret
      return crypto.pbkdf2Sync(encryptionKey, 'payment-service-salt', this.iterations, this.keyLength, 'sha256');
    }

    // Fallback: derive from JWT_SECRET (NOT recommended for production)
    if (config.JWT_SECRET) {
      logger.warn('Using JWT_SECRET for encryption key derivation. This is not recommended for production.');
      return crypto.pbkdf2Sync(config.JWT_SECRET, 'payment-service-salt', this.iterations, this.keyLength, 'sha256');
    }

    throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set for payment token encryption');
  }

  /**
   * Encrypt sensitive data
   * @param plaintext - Data to encrypt
   * @returns Encrypted data (iv:tag:ciphertext) as base64
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      return plaintext;
    }

    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;

      let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
      ciphertext += cipher.final('base64');

      const tag = cipher.getAuthTag();

      // Format: iv:tag:ciphertext (all base64 encoded)
      return `${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext}`;
    } catch (error) {
      logger.error('Encryption failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param encryptedData - Encrypted data (iv:tag:ciphertext) as base64
   * @returns Decrypted plaintext
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) {
      return encryptedData;
    }

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, tagBase64, ciphertext] = parts;
      const key = this.getEncryptionKey();
      const iv = Buffer.from(ivBase64, 'base64');
      const tag = Buffer.from(tagBase64, 'base64');

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(tag);

      let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      logger.error('Decryption failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Hash sensitive data (one-way, for comparison)
   * @param data - Data to hash
   * @returns Hashed data
   */
  hash(data: string): string {
    if (!data) {
      return data;
    }

    const key = this.getEncryptionKey();
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest('hex');
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
}

