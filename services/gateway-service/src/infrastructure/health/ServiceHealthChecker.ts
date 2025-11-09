
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export interface ServiceHealth {
  name: string;
  url: string;
  healthy: boolean;
  lastChecked: number;
  responseTime?: number;
  error?: string;
}

export class ServiceHealthChecker {
  private services: Map<string, string> = new Map();
  private healthCache: Map<string, ServiceHealth> = new Map();
  private checkInterval: number = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;
  private axiosInstance: AxiosInstance;

  constructor(checkInterval: number = 30000) {
    this.checkInterval = checkInterval;
    this.axiosInstance = axios.create({
      timeout: 5000,
      validateStatus: (status) => status < 500, // Consider 4xx as healthy (service is up)
    });
  }

  registerService(name: string, url: string): void {
    this.services.set(name, url);
    // Initial health check
    this.checkService(name).catch((error) => {
      logger.warn(`Initial health check failed for ${name}`, { error: error.message });
    });
  }

  async checkService(name: string): Promise<ServiceHealth> {
    const url = this.services.get(name);
    if (!url) {
      throw new Error(`Service ${name} not registered`);
    }

    const startTime = Date.now();
    try {
      const response = await this.axiosInstance.get(`${url}/health`);
      const responseTime = Date.now() - startTime;

      const health: ServiceHealth = {
        name,
        url,
        healthy: response.status === 200 && response.data?.success !== false,
        lastChecked: Date.now(),
        responseTime,
      };

      this.healthCache.set(name, health);
      return health;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const health: ServiceHealth = {
        name,
        url,
        healthy: false,
        lastChecked: Date.now(),
        responseTime,
        error: error.message || 'Health check failed',
      };

      this.healthCache.set(name, health);
      logger.warn(`Health check failed for ${name}`, { error: error.message });
      return health;
    }
  }

  async checkAllServices(): Promise<ServiceHealth[]> {
    const checks = Array.from(this.services.keys()).map((name) => this.checkService(name));
    return Promise.all(checks);
  }

  getServiceHealth(name: string): ServiceHealth | undefined {
    return this.healthCache.get(name);
  }

  getAllHealth(): ServiceHealth[] {
    return Array.from(this.healthCache.values());
  }

  isServiceHealthy(name: string): boolean {
    const health = this.healthCache.get(name);
    if (!health) {
      return true; // Assume healthy if not checked yet
    }

    // Consider service unhealthy if last check was more than 2 intervals ago
    const staleThreshold = this.checkInterval * 2;
    if (Date.now() - health.lastChecked > staleThreshold) {
      return false;
    }

    return health.healthy;
  }

  startPeriodicChecks(): void {
    if (this.intervalId) {
      return; // Already started
    }

    this.intervalId = setInterval(() => {
      this.checkAllServices().catch((error) => {
        logger.error('Error during periodic health checks', { error: error.message });
      });
    }, this.checkInterval);

    logger.info('Started periodic health checks', { interval: this.checkInterval });
  }

  stopPeriodicChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info('Stopped periodic health checks');
    }
  }
}

