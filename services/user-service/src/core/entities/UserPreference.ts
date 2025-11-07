/**
 * User Preference Entity - Core Domain Model
 * Key-value store for user preferences
 */

export interface UserPreference {
  id: string;
  userId: string;
  key: string;
  value: string; // JSON string or simple value
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPreferenceData {
  userId: string;
  key: string;
  value: string;
}

export interface UpdateUserPreferenceData {
  value: string;
}

