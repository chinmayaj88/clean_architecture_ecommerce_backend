/**
 * Update User Profile Use Case
 */

import { IUserProfileRepository } from '../../ports/interfaces/IUserProfileRepository';
import { UpdateUserProfileData, UserProfile } from '../entities/UserProfile';

export class UpdateUserProfileUseCase {
  constructor(
    private readonly userProfileRepository: IUserProfileRepository
  ) {}

  async execute(userId: string, data: UpdateUserProfileData): Promise<UserProfile> {
    // Check if profile exists
    const existing = await this.userProfileRepository.findByUserId(userId);
    if (!existing) {
      throw new Error('User profile not found');
    }

    return await this.userProfileRepository.update(userId, data);
  }
}

