
import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../ports/interfaces/IUserRepository';
import { IRefreshTokenRepository } from '../ports/interfaces/IRefreshTokenRepository';
import { IRoleRepository } from '../ports/interfaces/IRoleRepository';
import { IPasswordResetTokenRepository } from '../ports/interfaces/IPasswordResetTokenRepository';
import { IEmailVerificationTokenRepository } from '../ports/interfaces/IEmailVerificationTokenRepository';
import { ISecurityAuditLogRepository } from '../ports/interfaces/ISecurityAuditLogRepository';
import { IPasswordHasher } from '../ports/interfaces/IPasswordHasher';
import { ITokenService } from '../ports/interfaces/ITokenService';
import { IEventPublisher } from '../ports/interfaces/IEventPublisher';

import { PrismaUserRepository } from '../infrastructure/database/PrismaUserRepository';
import { PrismaRefreshTokenRepository } from '../infrastructure/database/PrismaRefreshTokenRepository';
import { PrismaRoleRepository } from '../infrastructure/database/PrismaRoleRepository';
import { PrismaPasswordResetTokenRepository } from '../infrastructure/database/PrismaPasswordResetTokenRepository';
import { PrismaEmailVerificationTokenRepository } from '../infrastructure/database/PrismaEmailVerificationTokenRepository';
import { PrismaSecurityAuditLogRepository } from '../infrastructure/database/PrismaSecurityAuditLogRepository';
import { BcryptPasswordHasher } from '../infrastructure/password/BcryptPasswordHasher';
import { JwtTokenService } from '../infrastructure/token/JwtTokenService';
import { MockEventPublisher } from '../infrastructure/events/MockEventPublisher';
import { SNSEventPublisher } from '../infrastructure/events/SNSEventPublisher';
import { createLogger } from '../infrastructure/logging/logger';
import { getEnvironmentConfig } from '../config/environment';

import { RegisterUserUseCase } from '../core/use-cases/RegisterUserUseCase';
import { LoginUseCase } from '../core/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../core/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../core/use-cases/LogoutUseCase';
import { ForgotPasswordUseCase } from '../core/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../core/use-cases/ResetPasswordUseCase';
import { VerifyEmailUseCase } from '../core/use-cases/VerifyEmailUseCase';
import { ResendVerificationEmailUseCase } from '../core/use-cases/ResendVerificationEmailUseCase';
import { ChangePasswordUseCase } from '../core/use-cases/ChangePasswordUseCase';
import { DeactivateAccountUseCase } from '../core/use-cases/DeactivateAccountUseCase';

import { AuthController } from '../application/controllers/AuthController';

export class Container {
  private static instance: Container;
  private prisma: PrismaClient;
  private userRepository: IUserRepository;
  private refreshTokenRepository: IRefreshTokenRepository;
  private roleRepository: IRoleRepository;
  private passwordResetTokenRepository: IPasswordResetTokenRepository;
  private emailVerificationTokenRepository: IEmailVerificationTokenRepository;
  private securityAuditLogRepository: ISecurityAuditLogRepository;
  private passwordHasher: IPasswordHasher;
  private tokenService: ITokenService;
  private eventPublisher: IEventPublisher;
  private registerUserUseCase: RegisterUserUseCase;
  private loginUseCase: LoginUseCase;
  private refreshTokenUseCase: RefreshTokenUseCase;
  private logoutUseCase: LogoutUseCase;
  private forgotPasswordUseCase: ForgotPasswordUseCase;
  private resetPasswordUseCase: ResetPasswordUseCase;
  private verifyEmailUseCase: VerifyEmailUseCase;
  private resendVerificationEmailUseCase: ResendVerificationEmailUseCase;
  private changePasswordUseCase: ChangePasswordUseCase;
  private deactivateAccountUseCase: DeactivateAccountUseCase;
  private authController: AuthController;

  private constructor() {
    const envConfig = getEnvironmentConfig();
    const dbConfig = envConfig.getDatabaseConfig();
    
    this.prisma = new PrismaClient({
      log: envConfig.isDevelopment() 
        ? ['query', 'error', 'warn'] 
        : envConfig.isStaging()
        ? ['error', 'warn']
        : ['error'],
    });

    this.userRepository = new PrismaUserRepository(this.prisma);
    this.refreshTokenRepository = new PrismaRefreshTokenRepository(this.prisma);
    this.roleRepository = new PrismaRoleRepository(this.prisma);
    this.passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(this.prisma);
    this.emailVerificationTokenRepository = new PrismaEmailVerificationTokenRepository(this.prisma);
    this.securityAuditLogRepository = new PrismaSecurityAuditLogRepository(this.prisma);

    this.passwordHasher = new BcryptPasswordHasher();
    this.tokenService = new JwtTokenService();
    this.eventPublisher = this.createEventPublisher();

    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.passwordHasher,
      this.tokenService,
      this.eventPublisher,
      this.roleRepository,
      this.emailVerificationTokenRepository
    );

    this.loginUseCase = new LoginUseCase(
      this.userRepository,
      this.passwordHasher,
      this.tokenService,
      this.refreshTokenRepository,
      this.securityAuditLogRepository
    );

    this.refreshTokenUseCase = new RefreshTokenUseCase(
      this.tokenService,
      this.refreshTokenRepository,
      this.userRepository
    );

    this.logoutUseCase = new LogoutUseCase(this.refreshTokenRepository);

    this.forgotPasswordUseCase = new ForgotPasswordUseCase(
      this.userRepository,
      this.passwordResetTokenRepository,
      this.eventPublisher
    );

    this.resetPasswordUseCase = new ResetPasswordUseCase(
      this.userRepository,
      this.passwordResetTokenRepository,
      this.passwordHasher
    );

    this.verifyEmailUseCase = new VerifyEmailUseCase(
      this.userRepository,
      this.emailVerificationTokenRepository
    );

    this.resendVerificationEmailUseCase = new ResendVerificationEmailUseCase(
      this.userRepository,
      this.emailVerificationTokenRepository,
      this.eventPublisher
    );

    this.changePasswordUseCase = new ChangePasswordUseCase(
      this.userRepository,
      this.passwordHasher
    );

    this.deactivateAccountUseCase = new DeactivateAccountUseCase(
      this.userRepository,
      this.passwordHasher,
      this.refreshTokenRepository,
      this.eventPublisher
    );

    // Initialize controllers
    this.authController = new AuthController(
      this.registerUserUseCase,
      this.loginUseCase,
      this.refreshTokenUseCase,
      this.logoutUseCase,
      this.forgotPasswordUseCase,
      this.resetPasswordUseCase,
      this.verifyEmailUseCase,
      this.resendVerificationEmailUseCase,
      this.changePasswordUseCase,
      this.deactivateAccountUseCase
    );
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // Getters
  public getAuthController(): AuthController {
    return this.authController;
  }

  public getTokenService(): ITokenService {
    return this.tokenService;
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  private createEventPublisher(): IEventPublisher {
    const logger = createLogger();
    const envConfig = getEnvironmentConfig();
    const eventPublisherType = process.env.EVENT_PUBLISHER_TYPE;

    if (eventPublisherType) {
      switch (eventPublisherType.toLowerCase()) {
        case 'sns':
          logger.info('Using SNS Event Publisher (explicit configuration)');
          return new SNSEventPublisher();
        case 'mock':
          logger.info('Using Mock Event Publisher (explicit configuration)');
          return new MockEventPublisher();
        default:
          logger.warn(`Unknown EVENT_PUBLISHER_TYPE: ${eventPublisherType}, using mock`);
          return new MockEventPublisher();
      }
    }

    if (envConfig.isDevelopment() && envConfig.shouldUseLocalStack()) {
      logger.info('Development with LocalStack detected, using SNS Event Publisher');
      return new SNSEventPublisher();
    }

    if (envConfig.isDevelopment() && !envConfig.shouldUseLocalStack()) {
      logger.info('Development without LocalStack, using Mock Event Publisher');
      return new MockEventPublisher();
    }

    if (envConfig.isStaging()) {
      logger.info('Staging environment detected, using minimal AWS SNS');
      return new SNSEventPublisher();
    }

    if (envConfig.isProduction()) {
      logger.info('Production environment detected, using full AWS SNS');
      return new SNSEventPublisher();
    }

    logger.info('Using Mock Event Publisher (default)');
    return new MockEventPublisher();
  }

  /**
   * Cleanup resources (e.g., close DB connections)
   */
  public async dispose(): Promise<void> {
    try {
      await this.prisma.$disconnect();
    } catch (error) {
      // Log but don't throw - we're shutting down
      const logger = createLogger();
      logger.error('Error disconnecting Prisma', { error });
    }
  }
}
