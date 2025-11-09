
// Simple metrics collector (can be extended to export to Prometheus)
export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  service?: string;
  timestamp: number;
}

export interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorsByCode: Record<number, number>;
}

export class MetricsCollector {
  private metrics: RequestMetrics[] = [];
  private maxMetrics: number = 10000; // Keep last 10k requests
  private serviceMetrics: Map<string, ServiceMetrics> = new Map();

  recordRequest(metric: RequestMetrics): void {
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Update service metrics
    const service = metric.service || 'unknown';
    this.updateServiceMetrics(service, metric);
  }

  private updateServiceMetrics(service: string, metric: RequestMetrics): void {
    if (!this.serviceMetrics.has(service)) {
      this.serviceMetrics.set(service, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        errorsByCode: {},
      });
    }

    const stats = this.serviceMetrics.get(service)!;
    stats.totalRequests++;
    stats.minResponseTime = Math.min(stats.minResponseTime, metric.responseTime);
    stats.maxResponseTime = Math.max(stats.maxResponseTime, metric.responseTime);

    if (metric.statusCode >= 200 && metric.statusCode < 400) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
      stats.errorsByCode[metric.statusCode] = (stats.errorsByCode[metric.statusCode] || 0) + 1;
    }

    // Calculate average response time (simple moving average)
    const recentMetrics = this.metrics
      .filter((m) => m.service === service)
      .slice(-100); // Last 100 requests
    if (recentMetrics.length > 0) {
      const sum = recentMetrics.reduce((acc, m) => acc + m.responseTime, 0);
      stats.averageResponseTime = Math.round(sum / recentMetrics.length);
    }
  }

  getServiceMetrics(service: string): ServiceMetrics | undefined {
    return this.serviceMetrics.get(service);
  }

  getAllMetrics(): Record<string, ServiceMetrics> {
    const result: Record<string, ServiceMetrics> = {};
    this.serviceMetrics.forEach((metrics, service) => {
      result[service] = metrics;
    });
    return result;
  }

  getRecentMetrics(limit: number = 100): RequestMetrics[] {
    return this.metrics.slice(-limit);
  }

  getMetricsSummary() {
    const totalRequests = this.metrics.length;
    const recentMetrics = this.metrics.slice(-1000); // Last 1000 requests
    const successful = recentMetrics.filter((m) => m.statusCode >= 200 && m.statusCode < 400).length;
    const failed = recentMetrics.filter((m) => m.statusCode >= 400).length;

    const avgResponseTime =
      recentMetrics.length > 0
        ? Math.round(recentMetrics.reduce((acc, m) => acc + m.responseTime, 0) / recentMetrics.length)
        : 0;

    return {
      totalRequests,
      recentRequests: recentMetrics.length,
      successfulRequests: successful,
      failedRequests: failed,
      successRate: recentMetrics.length > 0 ? ((successful / recentMetrics.length) * 100).toFixed(2) + '%' : '0%',
      averageResponseTime: avgResponseTime,
      serviceMetrics: this.getAllMetrics(),
    };
  }

  reset(): void {
    this.metrics = [];
    this.serviceMetrics.clear();
  }
}

// Singleton instance
let metricsCollector: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
  }
  return metricsCollector;
}

