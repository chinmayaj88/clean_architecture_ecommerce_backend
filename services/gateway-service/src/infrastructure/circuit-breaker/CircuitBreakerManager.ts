
import { CircuitBreaker, CircuitBreakerConfig } from './CircuitBreaker';

// Manages circuit breakers for multiple services
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig;

  constructor(defaultConfig: CircuitBreakerConfig) {
    this.defaultConfig = defaultConfig;
  }

  getBreaker(serviceName: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(config || this.defaultConfig));
    }
    return this.breakers.get(serviceName)!;
  }

  getBreakerMetrics() {
    const metrics: Record<string, any> = {};
    this.breakers.forEach((breaker, serviceName) => {
      metrics[serviceName] = breaker.getMetrics();
    });
    return metrics;
  }

  resetBreaker(serviceName: string): void {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.reset();
    }
  }

  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }
}

