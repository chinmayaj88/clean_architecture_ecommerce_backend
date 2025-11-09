
import { MetricsCollector, RequestMetrics } from '../infrastructure/metrics/MetricsCollector';

describe('MetricsCollector', () => {
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    metricsCollector = new MetricsCollector();
  });

  it('should record request metrics', () => {
    const metric: RequestMetrics = {
      method: 'GET',
      path: '/api/v1/products',
      statusCode: 200,
      responseTime: 50,
      service: 'product-service',
      timestamp: Date.now(),
    };

    metricsCollector.recordRequest(metric);
    const metrics = metricsCollector.getServiceMetrics('product-service');
    
    expect(metrics).toBeDefined();
    expect(metrics?.totalRequests).toBe(1);
    expect(metrics?.successfulRequests).toBe(1);
  });

  it('should track failed requests', () => {
    const metric: RequestMetrics = {
      method: 'GET',
      path: '/api/v1/products',
      statusCode: 500,
      responseTime: 100,
      service: 'product-service',
      timestamp: Date.now(),
    };

    metricsCollector.recordRequest(metric);
    const metrics = metricsCollector.getServiceMetrics('product-service');
    
    expect(metrics?.failedRequests).toBe(1);
    expect(metrics?.errorsByCode[500]).toBe(1);
  });

  it('should calculate average response time', () => {
    metricsCollector.recordRequest({
      method: 'GET',
      path: '/api/v1/products',
      statusCode: 200,
      responseTime: 50,
      service: 'product-service',
      timestamp: Date.now(),
    });

    metricsCollector.recordRequest({
      method: 'GET',
      path: '/api/v1/products',
      statusCode: 200,
      responseTime: 100,
      service: 'product-service',
      timestamp: Date.now(),
    });

    const metrics = metricsCollector.getServiceMetrics('product-service');
    expect(metrics?.averageResponseTime).toBeGreaterThan(0);
  });

  it('should get metrics summary', () => {
    metricsCollector.recordRequest({
      method: 'GET',
      path: '/api/v1/products',
      statusCode: 200,
      responseTime: 50,
      service: 'product-service',
      timestamp: Date.now(),
    });

    const summary = metricsCollector.getMetricsSummary();
    expect(summary.totalRequests).toBe(1);
    expect(summary.successfulRequests).toBe(1);
    expect(summary.serviceMetrics).toBeDefined();
  });
});

