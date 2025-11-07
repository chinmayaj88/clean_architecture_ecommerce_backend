/**
 * Prisma Security Audit Log Repository Implementation
 */

import { PrismaClient } from '@prisma/client';
import {
  ISecurityAuditLogRepository,
  SecurityAuditLogData,
} from '../../ports/interfaces/ISecurityAuditLogRepository';

export class PrismaSecurityAuditLogRepository implements ISecurityAuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: SecurityAuditLogData): Promise<void> {
    await this.prisma.securityAuditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
    });
  }
}

