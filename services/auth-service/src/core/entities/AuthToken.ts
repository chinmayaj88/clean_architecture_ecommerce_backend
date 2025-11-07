/**
 * AuthToken Entity - Core Domain Model
 * Represents JWT token payload structure
 */

export interface AuthTokenPayload {
  userId: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

