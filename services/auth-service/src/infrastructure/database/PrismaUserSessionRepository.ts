/**
 * Prisma User Session Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IUserSessionRepository } from '../../ports/interfaces/IUserSessionRepository';
import { UserSession, CreateUserSessionData } from '../../core/entities/UserSession';

export class PrismaUserSessionRepository implements IUserSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserSessionData): Promise<UserSession> {
    const session = await this.prisma.userSession.create({
      data: {
        userId: data.userId,
        sessionToken: data.sessionToken,
        refreshTokenId: data.refreshTokenId,
        deviceId: data.deviceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        country: data.country,
        city: data.city,
        isActive: true,
        lastActivityAt: new Date(),
        expiresAt: data.expiresAt,
      },
    });

    return this.mapToEntity(session);
  }

  async findByToken(sessionToken: string): Promise<UserSession | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { sessionToken },
    });

    return session ? this.mapToEntity(session) : null;
  }

  async findById(id: string): Promise<UserSession | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { id },
    });

    return session ? this.mapToEntity(session) : null;
  }

  async findActiveByUserId(userId: string): Promise<UserSession[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    return sessions.map((s: any) => this.mapToEntity(s));
  }

  async findByUserId(userId: string): Promise<UserSession[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActivityAt: 'desc' },
    });

    return sessions.map((s: any) => this.mapToEntity(s));
  }

  async update(id: string, updates: Partial<UserSession>): Promise<UserSession> {
    const session = await this.prisma.userSession.update({
      where: { id },
      data: {
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.lastActivityAt && { lastActivityAt: updates.lastActivityAt }),
        ...(updates.revokedAt && { revokedAt: updates.revokedAt }),
      },
    });

    return this.mapToEntity(session);
  }

  async updateLastActivity(sessionToken: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { sessionToken },
      data: { lastActivityAt: new Date() },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
  }

  async revokeOthersByUserId(userId: string, currentSessionToken: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        isActive: true,
        sessionToken: { not: currentSessionToken },
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.userSession.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  }

  private mapToEntity(session: any): UserSession {
    return {
      id: session.id,
      userId: session.userId,
      sessionToken: session.sessionToken,
      refreshTokenId: session.refreshTokenId,
      deviceId: session.deviceId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      country: session.country,
      city: session.city,
      isActive: session.isActive,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      revokedAt: session.revokedAt,
    };
  }
}

