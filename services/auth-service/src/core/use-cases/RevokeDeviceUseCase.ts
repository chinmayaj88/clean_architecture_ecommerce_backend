/**
 * Revoke Device Use Case
 * Deactivates a device (logs out from that device)
 */

import { IDeviceRepository } from '../../ports/interfaces/IDeviceRepository';
import { IUserSessionRepository } from '../../ports/interfaces/IUserSessionRepository';

export class RevokeDeviceUseCase {
  constructor(
    private readonly deviceRepository: IDeviceRepository,
    private readonly sessionRepository: IUserSessionRepository
  ) {}

  async execute(deviceId: string, userId: string): Promise<void> {
    // Verify device belongs to user
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    if (device.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Deactivate device
    await this.deviceRepository.deactivate(deviceId);

    // Revoke all sessions for this device
    const sessions = await this.sessionRepository.findByUserId(userId);
    const deviceSessions = sessions.filter((s) => s.deviceId === deviceId);
    
    for (const session of deviceSessions) {
      await this.sessionRepository.revoke(session.id);
    }
  }
}

