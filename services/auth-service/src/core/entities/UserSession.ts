/**
 * User Session Entity
 * Represents an active user session
 */

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshTokenId?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  country?: string | null;
  city?: string | null;
  isActive: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date | null;
}

export interface CreateUserSessionData {
  userId: string;
  sessionToken: string;
  refreshTokenId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  expiresAt: Date;
}

