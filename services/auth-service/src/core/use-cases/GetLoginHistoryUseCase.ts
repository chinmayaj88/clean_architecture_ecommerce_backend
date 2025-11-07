/**
 * Get Login History Use Case
 * Retrieves login history for a user
 */

import { ILoginHistoryRepository } from '../../ports/interfaces/ILoginHistoryRepository';
import { LoginHistory } from '../../core/entities/LoginHistory';

export class GetLoginHistoryUseCase {
  constructor(private readonly loginHistoryRepository: ILoginHistoryRepository) {}

  async execute(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: 'success' | 'failed' | 'blocked';
      isSuspicious?: boolean;
    }
  ): Promise<{ history: LoginHistory[]; total: number }> {
    const [history, total] = await Promise.all([
      this.loginHistoryRepository.findByUserId(userId, options),
      this.loginHistoryRepository.countByUserId(userId, {
        status: options?.status,
        isSuspicious: options?.isSuspicious,
      }),
    ]);

    return { history, total };
  }
}

