/**
 * User Preference Repository Interface - Port
 */

import { UserPreference, CreateUserPreferenceData, UpdateUserPreferenceData } from '../../core/entities/UserPreference';

export interface IUserPreferenceRepository {
  create(data: CreateUserPreferenceData): Promise<UserPreference>;
  findByUserId(userId: string): Promise<UserPreference[]>;
  findByUserIdAndKey(userId: string, key: string): Promise<UserPreference | null>;
  update(userId: string, key: string, data: UpdateUserPreferenceData): Promise<UserPreference>;
  delete(userId: string, key: string): Promise<void>;
  deleteAllByUserId(userId: string): Promise<void>;
}

