/**
 * Update Device Use Case
 * Updates device information (name, trust status)
 */

import { IDeviceRepository } from '../../ports/interfaces/IDeviceRepository';
import { Device } from '../../core/entities/Device';

export class UpdateDeviceUseCase {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async execute(
    deviceId: string,
    userId: string,
    updates: {
      deviceName?: string;
      isTrusted?: boolean;
    }
  ): Promise<Device> {
    // Verify device belongs to user
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    if (device.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.deviceRepository.update(deviceId, updates);
  }
}

