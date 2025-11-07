/**
 * Metrics Hook Interface
 * Provides hooks for integrating with monitoring systems (Prometheus, CloudWatch, etc.)
 * Implementations can be added without modifying core code
 */

export interface IMetricsCollector {
  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void;

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(operation: string, duration: number, success: boolean): void;

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', duration: number): void;

  /**
   * Increment counter for specific event
   */
  incrementCounter(name: string, labels?: Record<string, string>): void;

  /**
   * Record gauge value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
}

/**
 * Default no-op metrics collector
 * Replace with actual implementation (Prometheus, CloudWatch, etc.) in production
 */
export class NoOpMetricsCollector implements IMetricsCollector {
  recordHttpRequest(_method: string, _path: string, _statusCode: number, _duration: number): void {
    // No-op - implement with actual metrics system
  }

  recordDatabaseQuery(_operation: string, _duration: number, _success: boolean): void {
    // No-op - implement with actual metrics system
  }

  recordCacheOperation(_operation: 'hit' | 'miss' | 'set' | 'delete', _duration: number): void {
    // No-op - implement with actual metrics system
  }

  incrementCounter(_name: string, _labels?: Record<string, string>): void {
    // No-op - implement with actual metrics system
  }

  setGauge(_name: string, _value: number, _labels?: Record<string, string>): void {
    // No-op - implement with actual metrics system
  }
}

// Singleton instance - replace with actual implementation
let metricsCollector: IMetricsCollector = new NoOpMetricsCollector();

export function getMetricsCollector(): IMetricsCollector {
  return metricsCollector;
}

export function setMetricsCollector(collector: IMetricsCollector): void {
  metricsCollector = collector;
}

