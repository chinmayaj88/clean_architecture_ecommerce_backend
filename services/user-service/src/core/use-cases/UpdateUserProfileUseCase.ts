/**
 * Update User Profile Use Case
 */

import { IUserProfileRepository } from '../../ports/interfaces/IUserProfileRepository';
import { IAddressRepository } from '../../ports/interfaces/IAddressRepository';
import { IPaymentMethodRepository } from '../../ports/interfaces/IPaymentMethodRepository';
import { UpdateUserProfileData, UserProfile } from '../entities/UserProfile';
import { CalculateProfileCompletionScoreUseCase } from './CalculateProfileCompletionScoreUseCase';

export class UpdateUserProfileUseCase {
  private calculateScoreUseCase: CalculateProfileCompletionScoreUseCase;

  constructor(
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly paymentMethodRepository: IPaymentMethodRepository
  ) {
    this.calculateScoreUseCase = new CalculateProfileCompletionScoreUseCase(this.userProfileRepository);
  }

  async execute(userId: string, data: UpdateUserProfileData): Promise<UserProfile> {
    // Check if profile exists
    const existing = await this.userProfileRepository.findByUserId(userId);
    if (!existing) {
      throw new Error('User profile not found');
    }

    // Update profile
    const updated = await this.userProfileRepository.update(userId, data);

    // Recalculate profile completion score
    const [addresses, paymentMethods] = await Promise.all([
      this.addressRepository.findByUserId(userId),
      this.paymentMethodRepository.findByUserId(userId),
    ]);

    const hasAddress = addresses.length > 0;
    const hasPaymentMethod = paymentMethods.length > 0;

    const score = this.calculateScoreUseCase.calculateScoreWithContext(
      updated,
      hasAddress,
      hasPaymentMethod
    );

    // Update with new score
    return await this.userProfileRepository.update(userId, {
      ...data,
      profileCompletionScore: score,
    });
  }
}

