/**
 * Verify MFA Use Case
 * Verifies TOTP code or backup code
 */

import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import * as crypto from 'crypto';

export class VerifyMFAUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, code: string): Promise<{ valid: boolean; isBackupCode: boolean }> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.mfaEnabled) {
      throw new Error('MFA not enabled for user');
    }

    // Try TOTP verification first
    if (this.verifyTOTP(code, (user as any).mfaSecret)) {
      return { valid: true, isBackupCode: false };
    }

    // Try backup code verification
    const backupCodes = (user as any).mfaBackupCodes || [];
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    
    if (backupCodes.includes(hashedCode)) {
      // Mark backup code as used (would need to update user)
      return { valid: true, isBackupCode: true };
    }

    return { valid: false, isBackupCode: false };
  }

  private verifyTOTP(code: string, secret: string): boolean {
    // TOTP verification using RFC 6238
    // This is a simplified version - in production, use a library like 'otplib'
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    
    // Check current time step and adjacent time steps (for clock skew)
    for (let i = -1; i <= 1; i++) {
      const time = timeStep + i;
      const expectedCode = this.generateTOTP(secret, time);
      if (code === expectedCode) {
        return true;
      }
    }

    return false;
  }

  private generateTOTP(secret: string, time: number): string {
    // Simplified TOTP generation
    // In production, use a proper TOTP library
    const key = Buffer.from(secret, 'base32');
    const timeBuffer = Buffer.allocUnsafe(8);
    timeBuffer.writeUInt32BE(Math.floor(time), 4);
    
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(timeBuffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const binary = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
    
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }
}

