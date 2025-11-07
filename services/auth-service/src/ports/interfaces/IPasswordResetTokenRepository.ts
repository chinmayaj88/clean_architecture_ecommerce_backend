/**
 * Password Reset Token Repository Interface - Port
 */

import { PasswordResetToken, CreatePasswordResetTokenData } from '../../core/entities/PasswordResetToken';

export interface IPasswordResetTokenRepository {
  create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;
  findByToken(token: string): Promise<PasswordResetToken | null>;
  markAsUsed(token: string): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteByUserId(userId: string): Promise<void>;
}

