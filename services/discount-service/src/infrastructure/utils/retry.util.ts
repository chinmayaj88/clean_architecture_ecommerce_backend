import { createLogger } from '../logging/logger';

const logger = createLogger();

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryableErrors?: Array<number | string>;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableErrors: [408, 429, 500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  onRetry: (attempt, error) => {
    logger.warn(`Retry attempt ${attempt}`, { error: error.message });
  },
};

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const isRetryable = isRetryableError(lastError, opts.retryableErrors);

      // Don't retry on last attempt or if error is not retryable
      if (attempt === opts.maxRetries || !isRetryable) {
        throw lastError;
      }

      // Call onRetry callback
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, lastError);
      }

      // Wait before retrying (exponential backoff)
      const delay = opts.retryDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function isRetryableError(error: Error, retryableErrors: Array<number | string>): boolean {
  // Check HTTP status codes
  const statusCode = (error as any)?.response?.status || (error as any)?.statusCode;
  if (statusCode && retryableErrors.includes(statusCode)) {
    return true;
  }

  // Check error codes
  const errorCode = (error as any)?.code || (error as any)?.errno;
  if (errorCode && retryableErrors.includes(errorCode)) {
    return true;
  }

  // Check error message
  const errorMessage = error.message.toLowerCase();
  if (retryableErrors.some(code => typeof code === 'string' && errorMessage.includes(code.toLowerCase()))) {
    return true;
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

