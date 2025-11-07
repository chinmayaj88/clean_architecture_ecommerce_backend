/**
 * Prisma User Preference Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IUserPreferenceRepository } from '../../ports/interfaces/IUserPreferenceRepository';
import { UserPreference, CreateUserPreferenceData, UpdateUserPreferenceData } from '../../core/entities/UserPreference';

export class PrismaUserPreferenceRepository implements IUserPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserPreferenceData): Promise<UserPreference> {
    const preference = await this.prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId: data.userId,
          key: data.key,
        },
      },
      create: {
        userId: data.userId,
        key: data.key,
        value: data.value,
      },
      update: {
        value: data.value,
      },
    });

    return this.mapToEntity(preference);
  }

  async findByUserId(userId: string): Promise<UserPreference[]> {
    const preferences = await this.prisma.userPreference.findMany({
      where: { userId },
      orderBy: { key: 'asc' },
    });

    return preferences.map((p: any) => this.mapToEntity(p));
  }

  async findByUserIdAndKey(userId: string, key: string): Promise<UserPreference | null> {
    const preference = await this.prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    return preference ? this.mapToEntity(preference) : null;
  }

  async update(userId: string, key: string, data: UpdateUserPreferenceData): Promise<UserPreference> {
    const preference = await this.prisma.userPreference.update({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      data: {
        value: data.value,
      },
    });

    return this.mapToEntity(preference);
  }

  async delete(userId: string, key: string): Promise<void> {
    await this.prisma.userPreference.delete({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.prisma.userPreference.deleteMany({
      where: { userId },
    });
  }

  private mapToEntity(preference: {
    id: string;
    userId: string;
    key: string;
    value: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserPreference {
    return {
      id: preference.id,
      userId: preference.userId,
      key: preference.key,
      value: preference.value,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  }
}

