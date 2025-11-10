import { PrismaClient } from '@prisma/client';

export interface IdempotencyRecord {
  id: string;
  key: string;
  paymentId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export class PrismaIdempotencyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Store idempotency key with payment ID
   * @param key - Idempotency key
   * @param paymentId - Payment ID
   * @param userId - User ID
   * @param ttlHours - Time to live in hours (default: 24)
   */
  async store(key: string, paymentId: string, userId: string, ttlHours: number = 24): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    // Use raw query to insert idempotency key (table may not exist in Prisma client yet)
    // This will work once migrations are run
    try {
      await (this.prisma as any).$executeRawUnsafe(
        `INSERT INTO idempotency_keys (id, key, "paymentId", "userId", "createdAt", "expiresAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
         ON CONFLICT (key) DO UPDATE SET "paymentId" = $2, "userId" = $3, "expiresAt" = $5`,
        key,
        paymentId,
        userId,
        new Date(),
        expiresAt
      );
    } catch (error) {
      // Fallback to Prisma client if table exists
      if ((this.prisma as any).idempotencyKey) {
        await (this.prisma as any).idempotencyKey.upsert({
          where: { key },
          update: {
            paymentId,
            userId,
            expiresAt,
          },
          create: {
            key,
            paymentId,
            userId,
            expiresAt,
          },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Get payment ID by idempotency key
   * @param key - Idempotency key
   * @returns Payment ID if found and not expired, null otherwise
   */
  async getPaymentId(key: string): Promise<string | null> {
    try {
      // Try using Prisma client first
      if ((this.prisma as any).idempotencyKey) {
        const record = await (this.prisma as any).idempotencyKey.findUnique({
          where: { key },
        });

        if (!record) {
          return null;
        }

        // Check if expired
        if (new Date() > record.expiresAt) {
          // Clean up expired record
          await (this.prisma as any).idempotencyKey.delete({
            where: { key },
          });
          return null;
        }

        return record.paymentId;
      }

      // Fallback to raw query
      const result = await (this.prisma as any).$queryRawUnsafe(
        `SELECT key, "paymentId", "expiresAt" FROM idempotency_keys WHERE key = $1`,
        key
      );

      if (!result || result.length === 0) {
        return null;
      }

      const record = result[0];

      // Check if expired
      if (new Date() > new Date(record.expiresAt)) {
        // Clean up expired record
        await (this.prisma as any).$executeRawUnsafe(
          `DELETE FROM idempotency_keys WHERE key = $1`,
          key
        );
        return null;
      }

      return record.paymentId;
    } catch (error) {
      // Table doesn't exist yet (migrations not run)
      return null;
    }
  }

  /**
   * Check if idempotency key exists and is valid
   * @param key - Idempotency key
   * @returns Idempotency record if valid, null otherwise
   */
  async get(key: string): Promise<IdempotencyRecord | null> {
    try {
      // Try using Prisma client first
      if ((this.prisma as any).idempotencyKey) {
        const record = await (this.prisma as any).idempotencyKey.findUnique({
          where: { key },
        });

        if (!record) {
          return null;
        }

        // Check if expired
        if (new Date() > record.expiresAt) {
          await (this.prisma as any).idempotencyKey.delete({
            where: { key },
          });
          return null;
        }

        return {
          id: record.id,
          key: record.key,
          paymentId: record.paymentId,
          userId: record.userId,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt,
        };
      }

      // Fallback to raw query
      const result = await (this.prisma as any).$queryRawUnsafe(
        `SELECT id, key, "paymentId", "userId", "createdAt", "expiresAt" FROM idempotency_keys WHERE key = $1`,
        key
      );

      if (!result || result.length === 0) {
        return null;
      }

      const record = result[0];

      // Check if expired
      if (new Date() > new Date(record.expiresAt)) {
        await (this.prisma as any).$executeRawUnsafe(
          `DELETE FROM idempotency_keys WHERE key = $1`,
          key
        );
        return null;
      }

      return {
        id: record.id,
        key: record.key,
        paymentId: record.paymentId,
        userId: record.userId,
        createdAt: new Date(record.createdAt),
        expiresAt: new Date(record.expiresAt),
      };
    } catch (error) {
      // Table doesn't exist yet (migrations not run)
      return null;
    }
  }

  /**
   * Clean up expired idempotency keys
   */
  async cleanupExpired(): Promise<number> {
    try {
      // Try using Prisma client first
      if ((this.prisma as any).idempotencyKey) {
        const result = await (this.prisma as any).idempotencyKey.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        });
        return result.count;
      }

      // Fallback to raw query
      const result = await (this.prisma as any).$executeRawUnsafe(
        `DELETE FROM idempotency_keys WHERE "expiresAt" < $1`,
        new Date()
      );
      return result as number;
    } catch (error) {
      // Table doesn't exist yet (migrations not run)
      return 0;
    }
  }
}

