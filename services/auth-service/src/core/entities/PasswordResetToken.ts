/**
 * Password Reset Token Entity - Core Domain Model
 */

export interface PasswordResetToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

export interface CreatePasswordResetTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
}

