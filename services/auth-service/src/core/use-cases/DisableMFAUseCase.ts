/**
 * Disable MFA Use Case
 */

import { IUserRepository } from '../../ports/interfaces/IUserRepository';

export class DisableMFAUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // In production, verify password before disabling MFA
    // For now, just disable MFA
    await this.userRepository.update(userId, {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: [],
    } as any);
  }
}

