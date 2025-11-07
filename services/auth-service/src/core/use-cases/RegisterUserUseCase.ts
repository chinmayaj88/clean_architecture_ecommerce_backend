
import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import { IPasswordHasher } from '../../ports/interfaces/IPasswordHasher';
import { ITokenService } from '../../ports/interfaces/ITokenService';
import { IEventPublisher, UserCreatedEvent } from '../../ports/interfaces/IEventPublisher';
import { IRoleRepository } from '../../ports/interfaces/IRoleRepository';
import { IEmailVerificationTokenRepository } from '../../ports/interfaces/IEmailVerificationTokenRepository';
import { RegisterRequest } from '../../ports/dtos/AuthDTOs';
import { randomBytes } from 'crypto';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly eventPublisher: IEventPublisher,
    private readonly roleRepository: IRoleRepository,
    private readonly emailVerificationTokenRepository: IEmailVerificationTokenRepository
  ) {}

  async execute(request: RegisterRequest) {
    const exists = await this.userRepository.existsByEmail(request.email);
    if (exists) {
      throw new Error('Email already registered');
    }

    const passwordHash = await this.passwordHasher.hash(request.password);
    const user = await this.userRepository.create({
      email: request.email,
      passwordHash,
      emailVerified: false,
      isActive: true,
    });

    const defaultRole = await this.roleRepository.findByName('user');
    if (defaultRole) {
      await this.roleRepository.assignRoleToUser(user.id, defaultRole.id);
    }

    const userWithRoles = await this.userRepository.findByEmailWithRoles(user.email);
    if (!userWithRoles) {
      throw new Error('Failed to retrieve created user');
    }

    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      roles: userWithRoles.roles,
    });

    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 86400000);

    await this.emailVerificationTokenRepository.create({
      token: verificationToken,
      userId: user.id,
      expiresAt,
    });

    const event: UserCreatedEvent = {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      source: 'auth-service',
    };

    this.eventPublisher.publish('user.created', event).catch(() => {
      // Event publishing failures are logged by the publisher
    });

    const verificationEvent = {
      userId: user.id,
      email: user.email,
      verificationToken,
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString(),
      source: 'auth-service',
    };

    this.eventPublisher.publish('user.email.verification.requested', verificationEvent).catch(() => {
      // Event publishing failures are logged by the publisher
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: userWithRoles.roles,
      },
      ...tokens,
    };
  }
}

