import axios, { AxiosInstance, AxiosError } from 'axios';
import { getEnvConfig } from '../../config/env';
import { createLogger } from '../logging/logger';
import { retry } from '../utils/retry.util';
import { getCircuitBreaker } from '../utils/circuitBreaker.util';

const logger = createLogger();
const config = getEnvConfig();
const circuitBreaker = getCircuitBreaker('user-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 60000,
});

export interface UserInfo {
  userId: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface IUserServiceClient {
  getUserById(userId: string): Promise<UserInfo | null>;
  getUserEmail(userId: string): Promise<string | null>;
}

export class UserServiceClient implements IUserServiceClient {
  private axiosInstance: AxiosInstance;
  private cache: Map<string, { data: UserInfo; expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.USER_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.USER_SERVICE_API_KEY && {
          'X-API-Key': config.USER_SERVICE_API_KEY,
        }),
        ...(config.USER_SERVICE_INTERNAL_TOKEN && {
          'X-Internal-Token': config.USER_SERVICE_INTERNAL_TOKEN,
        }),
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 404) {
          logger.warn('User not found', { userId: error.config?.url });
        } else if (error.response?.status >= 500) {
          logger.error('User service error', {
            status: error.response.status,
            url: error.config?.url,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get user information by ID with caching, retry, and circuit breaker
   */
  async getUserById(userId: string): Promise<UserInfo | null> {
    try {
      // Check cache first
      const cached = this.cache.get(userId);
      if (cached && cached.expiresAt > Date.now()) {
        logger.debug('User info retrieved from cache', { userId });
        return cached.data;
      }

      // Try to fetch from user service with circuit breaker and retry
      const response = await circuitBreaker.execute(() =>
        retry(
          async () => {
            // Try internal endpoint first (service-to-service)
            try {
              return await this.axiosInstance.get(`/internal/users/${userId}`, {
                timeout: 5000,
              });
            } catch (internalError: any) {
              // If internal endpoint doesn't exist (404), try regular endpoint
              // Note: Regular endpoint may require authentication
              if (internalError.response?.status === 404) {
                logger.debug('Internal endpoint not found, this is expected if not implemented', {
                  userId,
                });
                throw internalError;
              }
              throw internalError;
            }
          },
          {
            maxRetries: 2,
            retryDelay: 500,
            retryableErrors: [500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT'],
          }
        )
      );

      if (response.data && response.data.data) {
        const userData = response.data.data;
        const userInfo: UserInfo = {
          userId: userData.userId || userId,
          email: userData.email,
          phone: userData.phone || null,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
        };

        // Cache the result
        this.cache.set(userId, {
          data: userInfo,
          expiresAt: Date.now() + this.CACHE_TTL_MS,
        });

        logger.debug('User info fetched from user service', { userId, hasEmail: !!userInfo.email });
        return userInfo;
      }

      logger.warn('User service returned empty data', { userId });
      return null;
    } catch (error: any) {
      // Handle circuit breaker open state
      if (error.message?.includes('Circuit breaker')) {
        logger.warn('User service circuit breaker is open', { userId });
        // Return cached data if available, even if expired
        const cached = this.cache.get(userId);
        if (cached) {
          logger.info('Returning stale user data from cache due to circuit breaker', { userId });
          return cached.data;
        }
        return null;
      }

      if (error.response?.status === 404) {
        logger.warn('User not found in user service', { userId });
        return null;
      }

      logger.error('Failed to fetch user from user service', {
        userId,
        error: error.message,
        status: error.response?.status,
      });

      // Return cached data if available (even if expired) as fallback
      const cached = this.cache.get(userId);
      if (cached) {
        logger.info('Returning stale user data from cache due to error', { userId });
        return cached.data;
      }

      // Don't throw - return null so notification can still be attempted with available data
      return null;
    }
  }

  /**
   * Get user email by ID (convenience method)
   */
  async getUserEmail(userId: string): Promise<string | null> {
    const userInfo = await this.getUserById(userId);
    return userInfo?.email || null;
  }

  /**
   * Clear cache for a specific user
   */
  clearCache(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}

