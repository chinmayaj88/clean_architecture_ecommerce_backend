/**
 * Prisma Device Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import { IDeviceRepository } from '../../ports/interfaces/IDeviceRepository';
import { Device, CreateDeviceData } from '../../core/entities/Device';

export class PrismaDeviceRepository implements IDeviceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(data: CreateDeviceData): Promise<Device> {
    const device = await this.prisma.device.upsert({
      where: { deviceId: data.deviceId },
      update: {
        lastUsedAt: new Date(),
        ipAddress: data.ipAddress,
        country: data.country,
        city: data.city,
        isActive: true,
      },
      create: {
        userId: data.userId,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        os: data.os,
        browser: data.browser,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        country: data.country,
        city: data.city,
        isTrusted: false,
        lastUsedAt: new Date(),
        firstSeenAt: new Date(),
        isActive: true,
      },
    });

    return this.mapToEntity(device);
  }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    return device ? this.mapToEntity(device) : null;
  }

  async findById(id: string): Promise<Device | null> {
    const device = await this.prisma.device.findUnique({
      where: { id },
    });

    return device ? this.mapToEntity(device) : null;
  }

  async findByUserId(userId: string, includeInactive = false): Promise<Device[]> {
    const devices = await this.prisma.device.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return devices.map((d) => this.mapToEntity(d));
  }

  async update(id: string, updates: Partial<Device>): Promise<Device> {
    const device = await this.prisma.device.update({
      where: { id },
      data: {
        ...(updates.deviceName !== undefined && { deviceName: updates.deviceName }),
        ...(updates.isTrusted !== undefined && { isTrusted: updates.isTrusted }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.lastUsedAt && { lastUsedAt: updates.lastUsedAt }),
      },
    });

    return this.mapToEntity(device);
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.device.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.device.delete({
      where: { id },
    });
  }

  async updateLastUsed(deviceId: string): Promise<void> {
    await this.prisma.device.update({
      where: { deviceId },
      data: { lastUsedAt: new Date() },
    });
  }

  private mapToEntity(device: any): Device {
    return {
      id: device.id,
      userId: device.userId,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      os: device.os,
      browser: device.browser,
      userAgent: device.userAgent,
      ipAddress: device.ipAddress,
      country: device.country,
      city: device.city,
      isTrusted: device.isTrusted,
      lastUsedAt: device.lastUsedAt,
      firstSeenAt: device.firstSeenAt,
      isActive: device.isActive,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }
}

