
import { IUserProfileRepository } from '../../ports/interfaces/IUserProfileRepository';
import { CreateUserProfileData, UserProfile } from '../entities/UserProfile';

export class CreateUserProfileUseCase {
  constructor(
    private readonly userProfileRepository: IUserProfileRepository
  ) {}

  async execute(data: CreateUserProfileData): Promise<UserProfile> {
    const exists = await this.userProfileRepository.existsByUserId(data.userId);
    if (exists) {
      throw new Error('User profile already exists');
    }

    const emailExists = await this.userProfileRepository.existsByEmail(data.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    return await this.userProfileRepository.create(data);
  }
}

