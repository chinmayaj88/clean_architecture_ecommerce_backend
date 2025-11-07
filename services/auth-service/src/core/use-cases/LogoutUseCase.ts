/**
 * Logout Use Case
 * Business logic for user logout (revokes refresh token)
 */

import { IRefreshTokenRepository } from '../../ports/interfaces/IRefreshTokenRepository';
import { LogoutRequest } from '../../ports/dtos/AuthDTOs';

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  /**
   * Execute logout (revoke refresh token)
   */
  async execute(request: LogoutRequest): Promise<void> {
    await this.refreshTokenRepository.revoke(request.refreshToken);
  }
}

