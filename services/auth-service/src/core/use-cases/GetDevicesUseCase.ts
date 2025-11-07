/**
 * Get Devices Use Case
 * Retrieves all devices for a user
 */

import { IDeviceRepository } from '../../ports/interfaces/IDeviceRepository';
import { Device } from '../../core/entities/Device';

export class GetDevicesUseCase {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async execute(userId: string, includeInactive = false): Promise<Device[]> {
    return this.deviceRepository.findByUserId(userId, includeInactive);
  }
}

