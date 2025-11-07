/**
 * Security Audit Log Repository Interface
 * For tracking security-sensitive operations
 */

export interface SecurityAuditLogData {
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface ISecurityAuditLogRepository {
  create(data: SecurityAuditLogData): Promise<void>;
}

