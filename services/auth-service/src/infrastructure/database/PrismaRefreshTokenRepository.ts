/**
 * Prisma Refresh Token Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IRefreshTokenRepository } from '../../ports/interfaces/IRefreshTokenRepository';
import { RefreshToken, CreateRefreshTokenData } from '../../core/entities/RefreshToken';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const token = await this.prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });

    return this.mapToEntity(token);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    return refreshToken ? this.mapToEntity(refreshToken) : null;
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  private mapToEntity(token: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    revoked: boolean;
    revokedAt: Date | null;
    createdAt: Date;
  }): RefreshToken {
    return {
      id: token.id,
      token: token.token,
      userId: token.userId,
      expiresAt: token.expiresAt,
      revoked: token.revoked,
      revokedAt: token.revokedAt ?? undefined,
      createdAt: token.createdAt,
    };
  }
}

