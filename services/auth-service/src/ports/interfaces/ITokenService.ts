/**
 * Token Service Interface - Port
 * Defines the contract for JWT token operations
 */

import { AuthTokenPayload, AuthTokens } from '../../core/entities/AuthToken';

export interface ITokenService {
  /**
   * Generate access and refresh tokens
   */
  generateTokens(payload: Omit<AuthTokenPayload, 'type' | 'iat' | 'exp'>): Promise<AuthTokens>;

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): Promise<AuthTokenPayload>;

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): Promise<AuthTokenPayload>;

  /**
   * Decode token without verification (for inspection)
   */
  decodeToken(token: string): AuthTokenPayload | null;
}

