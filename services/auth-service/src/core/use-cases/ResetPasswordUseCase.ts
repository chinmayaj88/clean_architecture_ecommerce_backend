/**
 * Reset Password Use Case
 * Validates reset token and updates password
 */

import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import { IPasswordResetTokenRepository } from '../../ports/interfaces/IPasswordResetTokenRepository';
import { IPasswordHasher } from '../../ports/interfaces/IPasswordHasher';
import { ResetPasswordRequest } from '../../ports/dtos/AuthDTOs';

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  /**
   * Execute password reset
   * @throws {Error} If token is invalid, expired, or already used
   */
  async execute(request: ResetPasswordRequest): Promise<void> {
    // Find reset token
    const resetToken = await this.passwordResetTokenRepository.findByToken(request.token);
    if (!resetToken) {
      throw new Error('Invalid reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Check if token is already used
    if (resetToken.used) {
      throw new Error('Reset token has already been used');
    }

    // Get user
    const user = await this.userRepository.findById(resetToken.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Hash new password
    const passwordHash = await this.passwordHasher.hash(request.password);

    // Update user password
    await this.userRepository.update(user.id, {
      ...user,
      passwordHash,
    });

    // Mark token as used
    await this.passwordResetTokenRepository.markAsUsed(request.token);

    // Revoke all refresh tokens for security
    // This would require IRefreshTokenRepository - add if needed
  }
}

