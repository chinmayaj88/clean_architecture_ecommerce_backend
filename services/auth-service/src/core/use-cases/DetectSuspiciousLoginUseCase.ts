/**
 * Detect Suspicious Login Use Case
 * Analyzes login attempts for suspicious patterns
 */

import { ILoginHistoryRepository } from '../../ports/interfaces/ILoginHistoryRepository';
import { IDeviceRepository } from '../../ports/interfaces/IDeviceRepository';

export interface SuspiciousLoginDetection {
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number; // 0-100
}

export class DetectSuspiciousLoginUseCase {
  constructor(
    private readonly loginHistoryRepository: ILoginHistoryRepository,
    private readonly deviceRepository: IDeviceRepository
  ) {}

  async execute(
    userId: string,
    ipAddress: string,
    userAgent: string,
    deviceId: string
  ): Promise<SuspiciousLoginDetection> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check recent login history
    const recentLogins = await this.loginHistoryRepository.findByUserId(userId, {
      limit: 10,
      status: 'success',
    });

    // Check if IP address is new
    const knownIPs = new Set(recentLogins.map((l) => l.ipAddress).filter(Boolean));
    if (!knownIPs.has(ipAddress)) {
      reasons.push('New IP address');
      riskScore += 20;
    }

    // Check if device is new
    const device = await this.deviceRepository.findByDeviceId(deviceId);
    if (!device || device.userId !== userId) {
      reasons.push('New device');
      riskScore += 30;
    } else if (!device.isTrusted) {
      reasons.push('Untrusted device');
      riskScore += 15;
    }

    // Check for multiple failed attempts from same IP
    const failedAttempts = await this.loginHistoryRepository.getRecentFailedAttempts(userId, 1);
    const failedFromSameIP = failedAttempts.filter((a) => a.ipAddress === ipAddress);
    if (failedFromSameIP.length >= 3) {
      reasons.push('Multiple failed attempts from same IP');
      riskScore += 25;
    }

    // Check for login from different country (if geolocation available)
    const recentSuccessfulLogin = recentLogins[0];
    if (recentSuccessfulLogin?.country && recentSuccessfulLogin.country !== 'unknown') {
      // In production, compare with current IP's country
      // For now, we'll skip this check
    }

    // Check time-based patterns (login at unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      reasons.push('Unusual login time');
      riskScore += 10;
    }

    const isSuspicious = riskScore >= 30; // Threshold for suspicious

    return {
      isSuspicious,
      reasons,
      riskScore: Math.min(100, riskScore),
    };
  }
}

