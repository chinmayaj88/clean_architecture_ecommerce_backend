/**
 * Prisma User Profile Repository Implementation
 * Includes Redis caching for frequently accessed data
 */

import { PrismaClient } from '@prisma/client';
import { IUserProfileRepository } from '../../ports/interfaces/IUserProfileRepository';
import { UserProfile, CreateUserProfileData, UpdateUserProfileData } from '../../core/entities/UserProfile';
import { getCache } from '../cache/RedisCache';

const CACHE_TTL = {
  PROFILE_BY_ID: 900, // 15 minutes
  PROFILE_BY_USER_ID: 900, // 15 minutes
  PROFILE_BY_EMAIL: 900, // 15 minutes
};

export class PrismaUserProfileRepository implements IUserProfileRepository {
  private cache = getCache();

  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserProfileData): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.create({
      data: {
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        preferredCurrency: data.preferredCurrency || 'USD',
        preferredLanguage: data.preferredLanguage || 'en',
        isActive: true,
        emailVerified: false,
      },
    });

    const entity = this.mapToEntity(profile);
    
    // Invalidate cache
    await this.cache.delPattern(`profile:userId:${data.userId}*`);
    await this.cache.delPattern(`profile:email:${data.email}*`);

    return entity;
  }

  async findById(id: string): Promise<UserProfile | null> {
    const cacheKey = `profile:id:${id}`;
    const cached = await this.cache.get<UserProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      return null;
    }

    const entity = this.mapToEntity(profile);
    await this.cache.set(cacheKey, entity, CACHE_TTL.PROFILE_BY_ID);

    return entity;
  }

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const cacheKey = `profile:userId:${userId}`;
    const cached = await this.cache.get<UserProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    const entity = this.mapToEntity(profile);
    await this.cache.set(cacheKey, entity, CACHE_TTL.PROFILE_BY_USER_ID);
    await this.cache.set(`profile:id:${entity.id}`, entity, CACHE_TTL.PROFILE_BY_ID);
    await this.cache.set(`profile:email:${entity.email}`, entity, CACHE_TTL.PROFILE_BY_EMAIL);

    return entity;
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const cacheKey = `profile:email:${email}`;
    const cached = await this.cache.get<UserProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { email },
    });

    if (!profile) {
      return null;
    }

    const entity = this.mapToEntity(profile);
    await this.cache.set(cacheKey, entity, CACHE_TTL.PROFILE_BY_EMAIL);
    await this.cache.set(`profile:userId:${entity.userId}`, entity, CACHE_TTL.PROFILE_BY_USER_ID);

    return entity;
  }

  async update(userId: string, data: UpdateUserProfileData): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        preferredCurrency: data.preferredCurrency,
        preferredLanguage: data.preferredLanguage,
        newsletterSubscribed: data.newsletterSubscribed,
        marketingOptIn: data.marketingOptIn,
      },
    });

    const entity = this.mapToEntity(profile);
    
    // Invalidate cache
    await this.cache.delPattern(`profile:userId:${userId}*`);
    await this.cache.delPattern(`profile:email:${profile.email}*`);
    await this.cache.delPattern(`profile:id:${entity.id}*`);

    return entity;
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.userProfile.delete({
      where: { userId },
    });

    // Invalidate cache
    await this.cache.delPattern(`profile:userId:${userId}*`);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.userProfile.count({
      where: { userId },
    });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.userProfile.count({
      where: { email },
    });
    return count > 0;
  }

  private mapToEntity(profile: {
    id: string;
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    preferredCurrency: string | null;
    preferredLanguage: string | null;
    newsletterSubscribed: boolean;
    marketingOptIn: boolean;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }): UserProfile {
    return {
      id: profile.id,
      userId: profile.userId,
      email: profile.email,
      firstName: profile.firstName ?? undefined,
      lastName: profile.lastName ?? undefined,
      phone: profile.phone ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      dateOfBirth: profile.dateOfBirth ?? undefined,
      gender: profile.gender as 'male' | 'female' | 'other' | 'prefer-not-to-say' | undefined,
      preferredCurrency: profile.preferredCurrency ?? undefined,
      preferredLanguage: profile.preferredLanguage ?? undefined,
      newsletterSubscribed: profile.newsletterSubscribed,
      marketingOptIn: profile.marketingOptIn,
      isActive: profile.isActive,
      emailVerified: profile.emailVerified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      lastLoginAt: profile.lastLoginAt ?? undefined,
    };
  }
}

