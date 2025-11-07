/**
 * Get User Profile Use Case
 */

import { IUserProfileRepository } from '../../ports/interfaces/IUserProfileRepository';
import { UserProfile } from '../entities/UserProfile';

export class GetUserProfileUseCase {
  constructor(
    private readonly userProfileRepository: IUserProfileRepository
  ) {}

  async execute(userId: string): Promise<UserProfile | null> {
    return await this.userProfileRepository.findByUserId(userId);
  }
}

