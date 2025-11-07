/**
 * Prisma Role Repository Implementation
 * Includes Redis caching for role lookups
 */

import { PrismaClient } from '@prisma/client';
import { IRoleRepository } from '../../ports/interfaces/IRoleRepository';
import { Role, CreateRoleData } from '../../core/entities/Role';
import { getCache } from '../cache/RedisCache';
import { getEnvironmentConfig } from '../../config/environment';

export class PrismaRoleRepository implements IRoleRepository {
  private cache = getCache();
  private envConfig = getEnvironmentConfig();

  private getCacheTTL() {
    const baseTTL = this.envConfig.getRedisConfig().cacheTTL;
    return {
      ROLE_BY_ID: baseTTL * 2,
      ROLE_BY_NAME: baseTTL * 2,
      USER_ROLES: baseTTL * 2,
    };
  }

  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateRoleData): Promise<Role> {
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });

    return this.mapToEntity(role);
  }

  async findById(id: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    return role ? this.mapToEntity(role) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    // Try cache first
    const cacheKey = `role:name:${name}`;
    const cached = await this.cache.get<Role>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const role = await this.prisma.role.findUnique({
      where: { name },
    });

    if (!role) {
      return null;
    }

    const entity = this.mapToEntity(role);
    const ttl = this.getCacheTTL();
    await this.cache.set(cacheKey, entity, ttl.ROLE_BY_NAME);
    await this.cache.set(`role:id:${entity.id}`, entity, ttl.ROLE_BY_ID);
    return entity;
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany();
    return roles.map((r) => this.mapToEntity(r));
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      create: {
        userId,
        roleId,
      },
      update: {},
    });

    // Invalidate cache
    await this.cache.del(`user:${userId}:roles`);
    await this.cache.delPattern(`user:email:*:roles`);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });
  }

  async getUserRoles(userId: string): Promise<string[]> {
    // Try cache first
    const cacheKey = `user:${userId}:roles`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    const roles = userRoles.map((ur) => ur.role.name);
    const ttl = this.getCacheTTL();
    await this.cache.set(cacheKey, roles, ttl.USER_ROLES);

    return roles;
  }

  private mapToEntity(role: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Role {
    return {
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

