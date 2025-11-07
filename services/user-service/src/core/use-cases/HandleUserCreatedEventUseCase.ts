/**
 * Handle User Created Event Use Case
 * Consumes user.created event from auth-service and creates user profile
 */

import { IUserProfileRepository } from '../../ports/interfaces/IUserProfileRepository';
import { CreateUserProfileData } from '../entities/UserProfile';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface UserCreatedEvent {
  userId: string;
  email: string;
  timestamp: string;
  source: string;
}

export class HandleUserCreatedEventUseCase {
  constructor(
    private readonly userProfileRepository: IUserProfileRepository
  ) {}

  async execute(event: UserCreatedEvent): Promise<void> {
    try {
      // Check if profile already exists (idempotency)
      const exists = await this.userProfileRepository.existsByUserId(event.userId);
      if (exists) {
        logger.info('User profile already exists, skipping creation', { userId: event.userId });
        return;
      }

      // Create user profile
      const profileData: CreateUserProfileData = {
        userId: event.userId,
        email: event.email,
        // Default values
        preferredCurrency: 'USD',
        preferredLanguage: 'en',
      };

      await this.userProfileRepository.create(profileData);
      logger.info('User profile created from event', { userId: event.userId, email: event.email });
    } catch (error) {
      logger.error('Failed to create user profile from event', { 
        userId: event.userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}

