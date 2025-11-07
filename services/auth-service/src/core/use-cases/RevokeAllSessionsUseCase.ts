/**
 * Revoke All Sessions Use Case
 * Revokes all sessions for a user (except optionally the current one)
 */

import { IUserSessionRepository } from '../../ports/interfaces/IUserSessionRepository';

export class RevokeAllSessionsUseCase {
  constructor(private readonly sessionRepository: IUserSessionRepository) {}

  async execute(userId: string, currentSessionToken?: string): Promise<void> {
    if (currentSessionToken) {
      // Revoke all except current
      await this.sessionRepository.revokeOthersByUserId(userId, currentSessionToken);
    } else {
      // Revoke all
      await this.sessionRepository.revokeAllByUserId(userId);
    }
  }
}

