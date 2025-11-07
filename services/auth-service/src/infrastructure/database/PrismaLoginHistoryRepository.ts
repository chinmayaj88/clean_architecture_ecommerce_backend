/**
 * Prisma Login History Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { ILoginHistoryRepository } from '../../ports/interfaces/ILoginHistoryRepository';
import { LoginHistory, CreateLoginHistoryData } from '../../core/entities/LoginHistory';

export class PrismaLoginHistoryRepository implements ILoginHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateLoginHistoryData): Promise<LoginHistory> {
    const history = await this.prisma.loginHistory.create({
      data: {
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
        country: data.country,
        city: data.city,
        isp: data.isp,
        status: data.status,
        failureReason: data.failureReason,
        isSuspicious: data.isSuspicious ?? false,
        suspiciousReason: data.suspiciousReason,
      },
    });

    return this.mapToEntity(history);
  }

  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: 'success' | 'failed' | 'blocked';
      isSuspicious?: boolean;
    }
  ): Promise<LoginHistory[]> {
    const where: any = { userId };
    
    if (options?.status) {
      where.status = options.status;
    }
    
    if (options?.isSuspicious !== undefined) {
      where.isSuspicious = options.isSuspicious;
    }

    const history = await this.prisma.loginHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return history.map((h) => this.mapToEntity(h));
  }

  async countByUserId(
    userId: string,
    filters?: {
      status?: 'success' | 'failed' | 'blocked';
      isSuspicious?: boolean;
    }
  ): Promise<number> {
    const where: any = { userId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.isSuspicious !== undefined) {
      where.isSuspicious = filters.isSuspicious;
    }

    return this.prisma.loginHistory.count({ where });
  }

  async findSuspiciousLogins(userId: string, limit = 10): Promise<LoginHistory[]> {
    const history = await this.prisma.loginHistory.findMany({
      where: {
        userId,
        isSuspicious: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return history.map((h) => this.mapToEntity(h));
  }

  async getRecentFailedAttempts(userId: string, hours = 24): Promise<LoginHistory[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const history = await this.prisma.loginHistory.findMany({
      where: {
        userId,
        status: 'failed',
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    return history.map((h) => this.mapToEntity(h));
  }

  private mapToEntity(history: any): LoginHistory {
    return {
      id: history.id,
      userId: history.userId,
      ipAddress: history.ipAddress,
      userAgent: history.userAgent,
      deviceId: history.deviceId,
      country: history.country,
      city: history.city,
      isp: history.isp,
      status: history.status,
      failureReason: history.failureReason,
      isSuspicious: history.isSuspicious,
      suspiciousReason: history.suspiciousReason,
      createdAt: history.createdAt,
    };
  }
}

