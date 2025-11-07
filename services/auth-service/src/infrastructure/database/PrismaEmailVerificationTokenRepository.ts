/**
 * Prisma Email Verification Token Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IEmailVerificationTokenRepository } from '../../ports/interfaces/IEmailVerificationTokenRepository';
import { EmailVerificationToken, CreateEmailVerificationTokenData } from '../../core/entities/EmailVerificationToken';

export class PrismaEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateEmailVerificationTokenData): Promise<EmailVerificationToken> {
    const token = await this.prisma.emailVerificationToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });

    return this.mapToEntity(token);
  }

  async findByToken(token: string): Promise<EmailVerificationToken | null> {
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    return verificationToken ? this.mapToEntity(verificationToken) : null;
  }

  async markAsVerified(token: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { token },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.emailVerificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });
  }

  private mapToEntity(token: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    verified: boolean;
    verifiedAt: Date | null;
    createdAt: Date;
  }): EmailVerificationToken {
    return {
      id: token.id,
      token: token.token,
      userId: token.userId,
      expiresAt: token.expiresAt,
      verified: token.verified,
      verifiedAt: token.verifiedAt ?? undefined,
      createdAt: token.createdAt,
    };
  }
}

