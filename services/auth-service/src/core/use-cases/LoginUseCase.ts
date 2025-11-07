
import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import { IPasswordHasher } from '../../ports/interfaces/IPasswordHasher';
import { ITokenService } from '../../ports/interfaces/ITokenService';
import { IRefreshTokenRepository } from '../../ports/interfaces/IRefreshTokenRepository';
import { ISecurityAuditLogRepository } from '../../ports/interfaces/ISecurityAuditLogRepository';
import { LoginRequest } from '../../ports/dtos/AuthDTOs';
import { getEnvConfig } from '../../config/env';

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly securityAuditLogRepository: ISecurityAuditLogRepository
  ) {}

  async execute(request: LoginRequest & { ipAddress?: string; userAgent?: string }) {
    const config = getEnvConfig();
    
    const user = await this.userRepository.findByEmailWithRoles(request.email);
    if (!user) {
      await this.securityAuditLogRepository.create({
        action: 'login_failed',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        metadata: { reason: 'user_not_found', email: request.email },
      }).catch(() => {});
      
      throw new Error('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.securityAuditLogRepository.create({
        userId: user.id,
        action: 'login_blocked',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        metadata: { reason: 'account_locked', lockedUntil: user.lockedUntil.toISOString() },
      }).catch(() => {});
      
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account is locked. Please try again in ${minutesRemaining} minute(s).`);
    }

    if (!user.isActive) {
      await this.securityAuditLogRepository.create({
        userId: user.id,
        action: 'login_blocked',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        metadata: { reason: 'account_deactivated' },
      }).catch(() => {});
      
      throw new Error('Account is deactivated');
    }

    const isValid = await this.passwordHasher.compare(request.password, user.passwordHash);
    
    if (!isValid) {
      await this.userRepository.incrementFailedLoginAttempts(user.id);
      const updatedUser = await this.userRepository.findById(user.id);
      const failedAttempts = (updatedUser?.failedLoginAttempts ?? 0) + 1;
      
      if (failedAttempts >= config.MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + config.LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await this.userRepository.lockAccount(user.id, lockedUntil);
        
        await this.securityAuditLogRepository.create({
          userId: user.id,
          action: 'account_locked',
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          metadata: {
            reason: 'max_login_attempts_exceeded',
            failedAttempts,
            lockedUntil: lockedUntil.toISOString(),
          },
        }).catch(() => {});
        
        throw new Error(`Too many failed login attempts. Account locked for ${config.LOCKOUT_DURATION_MINUTES} minutes.`);
      }
      
      await this.securityAuditLogRepository.create({
        userId: user.id,
        action: 'login_failed',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        metadata: { failedAttempts, maxAttempts: config.MAX_LOGIN_ATTEMPTS },
      }).catch(() => {});
      
      throw new Error('Invalid email or password');
    }

    if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
      await this.userRepository.resetFailedLoginAttempts(user.id);
    }

    await this.securityAuditLogRepository.create({
      userId: user.id,
      action: 'login_success',
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    }).catch(() => {});

    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    const expiresInMs = this.parseExpiresIn(config.JWT_REFRESH_TOKEN_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + expiresInMs * 1000);

    await this.refreshTokenRepository.create({
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
      ...tokens,
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])?$/);
    if (!match) {
      return 3600;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return value;
    }
  }
}

