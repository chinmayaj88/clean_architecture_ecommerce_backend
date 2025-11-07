/**
 * Prisma Password Reset Token Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IPasswordResetTokenRepository } from '../../ports/interfaces/IPasswordResetTokenRepository';
import { PasswordResetToken, CreatePasswordResetTokenData } from '../../core/entities/PasswordResetToken';

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
    const token = await this.prisma.passwordResetToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });

    return this.mapToEntity(token);
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    return resetToken ? this.mapToEntity(resetToken) : null;
  }

  async markAsUsed(token: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { token },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
  }

  private mapToEntity(token: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    used: boolean;
    usedAt: Date | null;
    createdAt: Date;
  }): PasswordResetToken {
    return {
      id: token.id,
      token: token.token,
      userId: token.userId,
      expiresAt: token.expiresAt,
      used: token.used,
      usedAt: token.usedAt ?? undefined,
      createdAt: token.createdAt,
    };
  }
}

