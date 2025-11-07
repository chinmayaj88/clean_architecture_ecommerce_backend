
import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../ports/interfaces/IUserRepository';
import { User, UserWithRoles, CreateUserData } from '../../core/entities/User';
import { getCache } from '../cache/RedisCache';
import { getEnvironmentConfig } from '../../config/environment';

export class PrismaUserRepository implements IUserRepository {
  private cache = getCache();
  private envConfig = getEnvironmentConfig();

  private getCacheTTL() {
    const baseTTL = this.envConfig.getRedisConfig().cacheTTL;
    return {
      USER_BY_ID: baseTTL,
      USER_BY_EMAIL: baseTTL,
      USER_WITH_ROLES: Math.floor(baseTTL * 0.67),
    };
  }

  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        emailVerified: data.emailVerified ?? false,
        isActive: data.isActive ?? true,
      },
    });

    const entity = this.mapToEntity(user);
    await this.cache.delPattern(`user:email:${data.email}*`);
    await this.cache.delPattern(`user:id:${entity.id}*`);
    return entity;
  }

  async findById(id: string): Promise<User | null> {
    const cacheKey = `user:id:${id}`;
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const entity = this.mapToEntity(user);
    const ttl = this.getCacheTTL();
    await this.cache.set(cacheKey, entity, ttl.USER_BY_ID);
    return entity;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email}`;
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const entity = this.mapToEntity(user);
    const ttl = this.getCacheTTL();
    await this.cache.set(cacheKey, entity, ttl.USER_BY_EMAIL);
    await this.cache.set(`user:id:${entity.id}`, entity, ttl.USER_BY_ID);
    return entity;
  }

  async findByEmailWithRoles(email: string): Promise<UserWithRoles | null> {
    const cacheKey = `user:email:${email}:roles`;
    const cached = await this.cache.get<UserWithRoles>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const entity: UserWithRoles = {
      ...this.mapToEntity(user),
      roles,
    };
    
    const ttl = this.getCacheTTL();
    await this.cache.set(cacheKey, entity, ttl.USER_WITH_ROLES);
    return entity;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        emailVerified: data.emailVerified,
        isActive: data.isActive,
      },
    });

    const entity = this.mapToEntity(user);
    await this.cache.delPattern(`user:id:${id}*`);
    await this.cache.delPattern(`user:email:${user.email}*`);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });

    return count > 0;
  }

  async incrementFailedLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: {
          increment: 1,
        },
      },
    });
    
    await this.cache.delPattern(`user:id:${userId}*`);
    await this.cache.delPattern(`user:email:*`);
  }

  async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    
    await this.cache.delPattern(`user:id:${userId}*`);
    await this.cache.delPattern(`user:email:*`);
  }

  async lockAccount(userId: string, lockedUntil: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil,
      },
    });
    
    await this.cache.delPattern(`user:id:${userId}*`);
    await this.cache.delPattern(`user:email:*`);
  }

  private mapToEntity(user: {
    id: string;
    email: string;
    passwordHash: string;
    emailVerified: boolean;
    isActive: boolean;
    failedLoginAttempts: number | null;
    lockedUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      failedLoginAttempts: user.failedLoginAttempts ?? 0,
      lockedUntil: user.lockedUntil ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

