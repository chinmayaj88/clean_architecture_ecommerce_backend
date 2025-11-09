/**
 * Calculate Profile Completion Score Use Case
 * Calculates profile completion percentage based on filled fields
 */

import { IUserProfileRepository } from '../../ports/interfaces/IUserProfileRepository';
import { UserProfile } from '../../core/entities/UserProfile';

export class CalculateProfileCompletionScoreUseCase {
  constructor(private readonly userProfileRepository: IUserProfileRepository) {}

  async execute(userId: string): Promise<{ score: number; profile: UserProfile }> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const score = this.calculateScore(profile);
    
    // Update profile with new score
    const updatedProfile = await this.userProfileRepository.update(userId, {
      profileCompletionScore: score,
    });

    return { score, profile: updatedProfile };
  }

  private calculateScore(profile: UserProfile): number {
    const fields = {
      // Basic info (40 points)
      firstName: 5,
      lastName: 5,
      email: 5, // Always present
      phone: 5,
      dateOfBirth: 5,
      gender: 5,
      avatarUrl: 5,
      
      // E-commerce preferences (30 points)
      preferredCurrency: 10,
      preferredLanguage: 10,
      newsletterSubscribed: 5,
      marketingOptIn: 5,
      
      // Address (20 points)
      hasAddress: 20,
      
      // Payment method (10 points)
      hasPaymentMethod: 10,
    };

    let score = 0;

    // Basic info
    if (profile.firstName) score += fields.firstName;
    if (profile.lastName) score += fields.lastName;
    if (profile.email) score += fields.email;
    if (profile.phone) score += fields.phone;
    if (profile.dateOfBirth) score += fields.dateOfBirth;
    if (profile.gender) score += fields.gender;
    if (profile.avatarUrl) score += fields.avatarUrl;

    // E-commerce preferences
    if (profile.preferredCurrency) score += fields.preferredCurrency;
    if (profile.preferredLanguage) score += fields.preferredLanguage;
    if (profile.newsletterSubscribed) score += fields.newsletterSubscribed;
    if (profile.marketingOptIn) score += fields.marketingOptIn;

    // Note: Address and payment method checks would need to be done separately
    // as they're not part of the UserProfile entity directly
    // We'll handle this in the repository or use case that has access to those

    return Math.min(100, score);
  }

  /**
   * Calculate score with additional context (addresses, payment methods)
   */
  calculateScoreWithContext(
    profile: UserProfile,
    hasAddress: boolean,
    hasPaymentMethod: boolean
  ): number {
    let baseScore = this.calculateScore(profile);
    
    if (hasAddress) baseScore += 20;
    if (hasPaymentMethod) baseScore += 10;

    return Math.min(100, baseScore);
  }
}

