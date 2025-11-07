import Redis from 'ioredis';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export class RedisCache {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    const config = getEnvConfig();
    
    if (config.REDIS_URL) {
      try {
        this.client = new Redis(config.REDIS_URL, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          enableOfflineQueue: false,
        });

        this.client.on('connect', () => {
          logger.info('Redis client connecting...');
        });

        this.client.on('ready', () => {
          this.isConnected = true;
          logger.info('Redis client ready');
        });

        this.client.on('error', (error) => {
          this.isConnected = false;
          logger.error('Redis client error', { error: error.message });
        });

        this.client.on('close', () => {
          this.isConnected = false;
          logger.warn('Redis client connection closed');
        });
      } catch (error) {
        logger.error('Failed to initialize Redis client', { error });
        this.client = null;
      }
    } else {
      logger.info('Redis URL not provided, caching disabled');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis get error', { key, error });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error('Redis set error', { key, error });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error', { key, error });
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error('Redis delPattern error', { pattern, error });
      return 0;
    }
  }

  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  getClient(): Redis | null {
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    if (!this.client) {
      return { status: 'error', message: 'Redis not configured' };
    }

    if (!this.isConnected) {
      return { status: 'error', message: 'Redis not connected' };
    }

    try {
      await this.client.ping();
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

let cacheInstance: RedisCache | null = null;

export function getCache(): RedisCache {
  if (!cacheInstance) {
    cacheInstance = new RedisCache();
  }
  return cacheInstance;
}

