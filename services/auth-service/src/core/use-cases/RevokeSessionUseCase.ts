/**
 * Revoke Session Use Case
 * Revokes a specific session
 */

import { IUserSessionRepository } from '../../ports/interfaces/IUserSessionRepository';

export class RevokeSessionUseCase {
  constructor(private readonly sessionRepository: IUserSessionRepository) {}

  async execute(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.sessionRepository.revoke(sessionId);
  }
}

