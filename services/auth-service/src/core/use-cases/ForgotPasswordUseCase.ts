/**
 * Forgot Password Use Case
 * Generates password reset token and publishes event
 */

import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import { IPasswordResetTokenRepository } from '../../ports/interfaces/IPasswordResetTokenRepository';
import { IEventPublisher } from '../../ports/interfaces/IEventPublisher';
import { ForgotPasswordRequest } from '../../ports/dtos/AuthDTOs';
import { randomBytes } from 'crypto';

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  /**
   * Execute forgot password flow
   * Generates reset token and publishes event (don't reveal if user exists)
   */
  async execute(request: ForgotPasswordRequest): Promise<void> {
    // Find user by email
    const user = await this.userRepository.findByEmail(request.email);

    // Don't reveal if user exists (security best practice)
    if (!user || !user.isActive) {
      // Still return success to prevent email enumeration
      return;
    }

    // Delete existing reset tokens for this user
    await this.passwordResetTokenRepository.deleteByUserId(user.id);

    // Generate secure reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Create reset token
    await this.passwordResetTokenRepository.create({
      token: resetToken,
      userId: user.id,
      expiresAt,
    });

    // Publish password reset event (async)
    const event = {
      userId: user.id,
      email: user.email,
      resetToken,
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString(),
      source: 'auth-service',
    };

    this.eventPublisher.publish('user.password.reset.requested', event).catch((error) => {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Failed to publish password reset event:', error);
      }
    });
  }
}

