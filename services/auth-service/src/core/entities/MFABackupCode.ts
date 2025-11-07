/**
 * MFA Backup Code Entity
 */

export interface MFABackupCode {
  id: string;
  userId: string;
  code: string; // Hashed backup code
  used: boolean;
  usedAt?: Date | null;
  createdAt: Date;
  expiresAt: Date;
}

