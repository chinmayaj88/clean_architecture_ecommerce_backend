
import { createLogger } from '../infrastructure/logging/logger';

const logger = createLogger();

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // Base delay in ms
  retryableStatusCodes: number[]; // HTTP status codes to retry on
  retryableErrors: string[]; // Error messages to retry on
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 2,
  retryDelay: 100,
  retryableStatusCodes: [502, 503, 504, 408], // Gateway errors and timeouts
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'],
};

// Simple retry logic with exponential backoff
export async function retryRequest<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...defaultRetryConfig, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error, retryConfig)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === retryConfig.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = retryConfig.retryDelay * Math.pow(2, attempt);
      logger.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`, {
        error: error.message,
      });

      await sleep(delay);
    }
  }

  throw lastError || new Error('Request failed after retries');
}

function isRetryableError(error: any, config: RetryConfig): boolean {
  // Check status code
  if (error.response && error.response.status) {
    return config.retryableStatusCodes.includes(error.response.status);
  }

  // Check error code
  if (error.code) {
    return config.retryableErrors.includes(error.code);
  }

  // Check error message
  if (error.message) {
    return config.retryableErrors.some((errCode) => error.message.includes(errCode));
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

