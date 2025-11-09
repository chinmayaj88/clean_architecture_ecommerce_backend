/**
 * Enable MFA Use Case
 * Generates TOTP secret and backup codes for user
 */

import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import * as crypto from 'crypto';

export interface MFAEnrollmentResult {
  secret: string; // TOTP secret (to be shown to user once)
  qrCodeUrl: string; // QR code URL for authenticator apps
  backupCodes: string[]; // Backup codes (to be shown to user once)
}

export class EnableMFAUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(userId: string, email: string): Promise<MFAEnrollmentResult> {
    // Generate TOTP secret (32 bytes base32 encoded)
    const secret = this.generateSecret();

    // Generate backup codes (10 codes, 8 characters each)
    const backupCodes = this.generateBackupCodes(10);

    // Hash backup codes before storing
    const hashedBackupCodes = backupCodes.map((code) => this.hashCode(code));

    // Update user with MFA settings
    await this.userRepository.update(userId, {
      mfaEnabled: true,
      mfaSecret: secret, // In production, encrypt this
      mfaBackupCodes: hashedBackupCodes,
    });

    // Generate QR code URL for authenticator apps
    const qrCodeUrl = this.generateQRCodeUrl(email, secret);

    return {
      secret,
      qrCodeUrl,
      backupCodes, // Return plain codes only once
    };
  }

  private generateSecret(): string {
    // Generate 20 random bytes and encode as base32
    const bytes = crypto.randomBytes(20);
    return this.base32Encode(bytes);
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private hashCode(code: string): string {
    // Hash backup code (in production, use bcrypt or similar)
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private generateQRCodeUrl(email: string, secret: string): string {
    const issuer = 'E-Commerce Platform';
    const accountName = email;
    const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    
    // Use a QR code service (in production, use a proper QR code library)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
  }
}

