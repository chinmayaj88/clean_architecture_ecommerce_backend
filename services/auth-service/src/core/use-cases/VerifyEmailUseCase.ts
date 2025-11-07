/**
 * Verify Email Use Case
 * Validates verification token and marks email as verified
 */

import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import { IEmailVerificationTokenRepository } from '../../ports/interfaces/IEmailVerificationTokenRepository';
import { VerifyEmailRequest } from '../../ports/dtos/AuthDTOs';

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository
  ) {}

  /**
   * Execute email verification
   * @throws {Error} If token is invalid, expired, or already used
   */
  async execute(request: VerifyEmailRequest): Promise<void> {
    // Find verification token
    const verificationToken = await this.emailVerificationTokenRepository.findByToken(request.token);
    if (!verificationToken) {
      throw new Error('Invalid verification token');
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      throw new Error('Verification token has expired');
    }

    // Check if already verified
    if (verificationToken.verified) {
      throw new Error('Email already verified');
    }

    // Get user
    const user = await this.userRepository.findById(verificationToken.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Mark email as verified
    await this.userRepository.update(user.id, {
      ...user,
      emailVerified: true,
    });

    // Mark token as verified
    await this.emailVerificationTokenRepository.markAsVerified(request.token);
  }
}

