/**
 * Email Verification Token Repository Interface - Port
 */

import { EmailVerificationToken, CreateEmailVerificationTokenData } from '../../core/entities/EmailVerificationToken';

export interface IEmailVerificationTokenRepository {
  create(data: CreateEmailVerificationTokenData): Promise<EmailVerificationToken>;
  findByToken(token: string): Promise<EmailVerificationToken | null>;
  markAsVerified(token: string): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteByUserId(userId: string): Promise<void>;
}

