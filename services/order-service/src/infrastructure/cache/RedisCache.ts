import Redis from 'ioredis';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';

const logger = createLogger();
const config = getEnvConfig();

let redisClient: Redis | null = null;
let cacheEnabled = false;

export function getCache() {
  if (!redisClient && config.REDIS_URL) {
    try {
      redisClient = new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 200, 2000);
        },
      });

      redisClient.on('connect', () => {
        logger.info('Redis connected');
        cacheEnabled = true;
      });

      redisClient.on('error', (error) => {
        logger.warn('Redis connection error', { error: error.message });
        cacheEnabled = false;
      });

      redisClient.on('close', () => {
        logger.warn('Redis connection closed');
        cacheEnabled = false;
      });
    } catch (error) {
      logger.warn('Failed to initialize Redis', { error });
      cacheEnabled = false;
    }
  }

  const memoryCache = new Map<string, { value: any; expiry: number }>();

  return {
    async get<T>(key: string): Promise<T | null> {
      if (!cacheEnabled || !redisClient) {
        const cached = memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.value as T;
        }
        if (cached) {
          memoryCache.delete(key);
        }
        return null;
      }

      try {
        const value = await redisClient.get(key);
        if (!value) {
          return null;
        }
        return JSON.parse(value) as T;
      } catch (error) {
        logger.warn('Redis get error', { error, key });
        return null;
      }
    },

    async set(key: string, value: any, ttl: number = 3600): Promise<void> {
      if (!cacheEnabled || !redisClient) {
        memoryCache.set(key, {
          value,
          expiry: Date.now() + ttl * 1000,
        });
        return;
      }

      try {
        await redisClient.setex(key, ttl, JSON.stringify(value));
      } catch (error) {
        logger.warn('Redis set error', { error, key });
      }
    },

    async del(key: string): Promise<void> {
      memoryCache.delete(key);

      if (!cacheEnabled || !redisClient) {
        return;
      }

      try {
        await redisClient.del(key);
      } catch (error) {
        logger.warn('Redis del error', { error, key });
      }
    },

    async delPattern(pattern: string): Promise<void> {
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          memoryCache.delete(key);
        }
      }

      if (!cacheEnabled || !redisClient) {
        return;
      }

      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch (error) {
        logger.warn('Redis delPattern error', { error, pattern });
      }
    },

    async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
      if (!config.REDIS_URL) {
        return {
          status: 'ok',
          message: 'Redis not configured, using in-memory cache',
        };
      }

      if (!redisClient || !cacheEnabled) {
        return {
          status: 'error',
          message: 'Redis not connected',
        };
      }

      try {
        await redisClient.ping();
        return { status: 'ok' };
      } catch (error: any) {
        return {
          status: 'error',
          message: error.message,
        };
      }
    },
  };
}

process.on('SIGTERM', () => {
  if (redisClient) {
    redisClient.quit();
  }
});

process.on('SIGINT', () => {
  if (redisClient) {
    redisClient.quit();
  }
});

