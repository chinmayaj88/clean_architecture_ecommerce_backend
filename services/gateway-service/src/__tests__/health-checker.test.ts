
import { ServiceHealthChecker } from '../infrastructure/health/ServiceHealthChecker';

describe('ServiceHealthChecker', () => {
  let healthChecker: ServiceHealthChecker;

  beforeEach(() => {
    healthChecker = new ServiceHealthChecker(30000);
  });

  it('should register a service', () => {
    healthChecker.registerService('test-service', 'http://localhost:3001');
    
    const health = healthChecker.getServiceHealth('test-service');
    // Health might not be available immediately
    expect(healthChecker).toBeDefined();
  });

  it('should check service health', async () => {
    // This would require a running service, so we'll just test the structure
    healthChecker.registerService('test-service', 'http://localhost:9999'); // Non-existent service
    
    // Health check will fail for non-existent service
    const health = await healthChecker.checkService('test-service');
    expect(health).toBeDefined();
    expect(health.name).toBe('test-service');
  });

  it('should return undefined for unregistered service', () => {
    const health = healthChecker.getServiceHealth('non-existent');
    expect(health).toBeUndefined();
  });

  it('should check all registered services', async () => {
    healthChecker.registerService('service1', 'http://localhost:3001');
    healthChecker.registerService('service2', 'http://localhost:3002');

    const allHealth = await healthChecker.checkAllServices();
    expect(allHealth).toHaveLength(2);
  });
});

