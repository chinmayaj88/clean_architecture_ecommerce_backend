/**
 * Refresh Token Use Case
 * Business logic for refreshing access tokens
 */

import { ITokenService } from '../../ports/interfaces/ITokenService';
import { IRefreshTokenRepository } from '../../ports/interfaces/IRefreshTokenRepository';
import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import { RefreshTokenRequest } from '../../ports/dtos/AuthDTOs';
import { getEnvConfig } from '../../config/env';

export class RefreshTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository
  ) {}

  /**
   * Execute token refresh
   * @throws {Error} If refresh token is invalid or revoked
   */
  async execute(request: RefreshTokenRequest) {
    // Verify refresh token
    let payload;
    try {
      payload = await this.tokenService.verifyRefreshToken(request.refreshToken);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }

    // Check if token exists in database and is not revoked
    const refreshToken = await this.refreshTokenRepository.findByToken(request.refreshToken);
    if (!refreshToken || refreshToken.revoked) {
      throw new Error('Refresh token has been revoked');
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      throw new Error('Refresh token has expired');
    }

    // Get user with roles
    const user = await this.userRepository.findByEmailWithRoles(payload.email);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    // Revoke old refresh token
    await this.refreshTokenRepository.revoke(request.refreshToken);

    // Store new refresh token
    const config = getEnvConfig();
    const expiresInMs = this.parseExpiresIn(config.JWT_REFRESH_TOKEN_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresInMs * 1000);

    await this.refreshTokenRepository.create({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
      ...tokens,
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])?$/);
    if (!match) {
      return 3600;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return value;
    }
  }
}

