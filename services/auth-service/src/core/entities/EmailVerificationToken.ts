/**
 * Email Verification Token Entity - Core Domain Model
 */

export interface EmailVerificationToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface CreateEmailVerificationTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
}

