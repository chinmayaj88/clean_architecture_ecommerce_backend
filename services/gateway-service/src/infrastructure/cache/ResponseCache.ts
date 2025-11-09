
import { createLogger } from '../logging/logger';

const logger = createLogger();

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// Simple in-memory cache (can be extended to use Redis)
export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 60000; // 1 minute default

  constructor(defaultTTL: number = 60000) {
    this.defaultTTL = defaultTTL;
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  generateKey(method: string, path: string, query?: string, userId?: string): string {
    // Include user ID in key for user-specific caching
    const userPart = userId ? `:user:${userId}` : '';
    const queryPart = query ? `:${query}` : '';
    return `${method}:${path}${queryPart}${userPart}`;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deletePattern(pattern: string): void {
    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];

    this.cache.forEach((_value, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      logger.debug(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
let responseCache: ResponseCache | null = null;

export function getResponseCache(): ResponseCache {
  if (!responseCache) {
    responseCache = new ResponseCache();
  }
  return responseCache;
}

