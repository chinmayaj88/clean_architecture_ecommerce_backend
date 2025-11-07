/**
 * Login History Entity
 * Tracks all login attempts and successful logins
 */

export interface LoginHistory {
  id: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
  country?: string | null;
  city?: string | null;
  isp?: string | null;
  status: 'success' | 'failed' | 'blocked';
  failureReason?: string | null;
  isSuspicious: boolean;
  suspiciousReason?: string | null;
  createdAt: Date;
}

export interface CreateLoginHistoryData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  country?: string;
  city?: string;
  isp?: string;
  status: 'success' | 'failed' | 'blocked';
  failureReason?: string;
  isSuspicious?: boolean;
  suspiciousReason?: string;
}

