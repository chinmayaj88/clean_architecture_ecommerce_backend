/**
 * User Profile Entity - Core Domain Model
 * Represents extended user information for e-commerce
 */

export interface UserProfile {
  id: string;
  userId: string; // Same as auth-service User.id
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  
  // E-commerce specific
  preferredCurrency?: string;
  preferredLanguage?: string;
  newsletterSubscribed: boolean;
  marketingOptIn: boolean;
  
  // Account status
  isActive: boolean;
  emailVerified: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Profile completion
  profileCompletionScore: number; // 0-100
}

export interface CreateUserProfileData {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
}

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  preferredCurrency?: string;
  preferredLanguage?: string;
  newsletterSubscribed?: boolean;
  marketingOptIn?: boolean;
}

