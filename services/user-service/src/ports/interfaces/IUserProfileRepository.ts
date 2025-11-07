/**
 * User Profile Repository Interface - Port
 * Defines the contract for user profile data access
 */

import { UserProfile, CreateUserProfileData, UpdateUserProfileData } from '../../core/entities/UserProfile';

export interface IUserProfileRepository {
  create(data: CreateUserProfileData): Promise<UserProfile>;
  findById(id: string): Promise<UserProfile | null>;
  findByUserId(userId: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  update(userId: string, data: UpdateUserProfileData): Promise<UserProfile>;
  delete(userId: string): Promise<void>;
  existsByUserId(userId: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}

