export interface User {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  isActive: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  mfaEnabled?: boolean;
  mfaSecret?: string | null;
  mfaBackupCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRoles extends User {
  roles: string[];
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  emailVerified?: boolean;
  isActive?: boolean;
}

