/**
 * RefreshToken Entity - Core Domain Model
 * Represents a refresh token for JWT rotation
 */

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
}

export interface CreateRefreshTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
}

