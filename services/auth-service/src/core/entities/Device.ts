/**
 * Device Entity
 * Represents a user's device for security tracking
 */

export interface Device {
  id: string;
  userId: string;
  deviceId: string; // Unique device fingerprint
  deviceName?: string | null;
  deviceType: string; // 'mobile', 'tablet', 'desktop', 'unknown'
  os?: string | null;
  browser?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  country?: string | null;
  city?: string | null;
  isTrusted: boolean;
  lastUsedAt: Date;
  firstSeenAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeviceData {
  userId: string;
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
}

