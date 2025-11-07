/**
 * Deactivate Account Use Case
 * Validates password and deactivates user account
 */

import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import { IPasswordHasher } from '../../ports/interfaces/IPasswordHasher';
import { IRefreshTokenRepository } from '../../ports/interfaces/IRefreshTokenRepository';
import { IEventPublisher } from '../../ports/interfaces/IEventPublisher';
import { DeactivateAccountRequest } from '../../ports/dtos/AuthDTOs';

export class DeactivateAccountUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  /**
   * Execute account deactivation
   * @throws {Error} If password is incorrect
   */
  async execute(userId: string, request: DeactivateAccountRequest): Promise<void> {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or already inactive');
    }

    // Verify password
    const isValid = await this.passwordHasher.compare(request.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Password is incorrect');
    }

    // Deactivate user account
    await this.userRepository.update(user.id, {
      ...user,
      isActive: false,
    });

    // Revoke all refresh tokens
    await this.refreshTokenRepository.revokeAllForUser(userId);

    // Publish user deactivated event (async)
    const event = {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      source: 'auth-service',
    };

    this.eventPublisher.publish('user.deactivated', event).catch((error) => {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Failed to publish user deactivated event:', error);
      }
    });
  }
}

