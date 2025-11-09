
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
    // Check if email already exists
    const exists = await this.userRepository.existsByEmail(request.email);
    if (exists) {
      throw new Error('Email already registered');
    }

    // Hash password and create user
    const passwordHash = await this.passwordHasher.hash(request.password);
    const user = await this.userRepository.create({
      email: request.email,
      passwordHash,
      emailVerified: false,
      isActive: true,
    });

    // Assign default 'user' role
    const defaultRole = await this.roleRepository.findByName('user');
    if (defaultRole) {
      await this.roleRepository.assignRoleToUser(user.id, defaultRole.id);
    }

    // Get user with roles for token generation
    const userWithRoles = await this.userRepository.findByEmailWithRoles(user.email);
    if (!userWithRoles) {
      throw new Error('Failed to retrieve created user');
    }

    // Generate JWT tokens
    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      roles: userWithRoles.roles,
    });

    // Create email verification token (24 hour expiry)
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 86400000); // 24 hours

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

    // Publish event (fire and forget - failures are logged)
    this.eventPublisher.publish('user.created', event).catch(() => {
      // Event failures are handled by the publisher
    });

    const verificationEvent = {
      userId: user.id,
      email: user.email,
      verificationToken,
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString(),
      source: 'auth-service',
    };

    // Send verification email event
    this.eventPublisher.publish('user.email.verification.requested', verificationEvent).catch(() => {
      // Errors are logged elsewhere
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

