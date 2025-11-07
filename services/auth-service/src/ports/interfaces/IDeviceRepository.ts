/**
 * Device Repository Interface
 * Defines contract for device data access
 */

import { Device, CreateDeviceData } from '../../core/entities/Device';

export interface IDeviceRepository {
  /**
   * Create or update device
   */
  upsert(data: CreateDeviceData): Promise<Device>;

  /**
   * Find device by deviceId
   */
  findByDeviceId(deviceId: string): Promise<Device | null>;

  /**
   * Find device by ID
   */
  findById(id: string): Promise<Device | null>;

  /**
   * Find all devices for a user
   */
  findByUserId(userId: string, includeInactive?: boolean): Promise<Device[]>;

  /**
   * Update device
   */
  update(id: string, updates: Partial<Device>): Promise<Device>;

  /**
   * Mark device as inactive
   */
  deactivate(id: string): Promise<void>;

  /**
   * Delete device
   */
  delete(id: string): Promise<void>;

  /**
   * Update last used timestamp
   */
  updateLastUsed(deviceId: string): Promise<void>;
}

