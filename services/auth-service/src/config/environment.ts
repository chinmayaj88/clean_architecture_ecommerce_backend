import { getEnvConfig } from './env';

export type Environment = 'development' | 'staging' | 'production' | 'test';

export class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private env: Environment;

  private constructor() {
    const config = getEnvConfig();
    this.env = config.NODE_ENV;
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  public getEnvironment(): Environment {
    return this.env;
  }

  public isDevelopment(): boolean {
    return this.env === 'development';
  }

  public isStaging(): boolean {
    return this.env === 'staging';
  }

  public isProduction(): boolean {
    return this.env === 'production';
  }

  public isTest(): boolean {
    return this.env === 'test';
  }

  public shouldUseLocalStack(): boolean {
    return this.isDevelopment() && !!process.env.LOCALSTACK_ENDPOINT;
  }

  public shouldUseCloudServices(): boolean {
    return this.isStaging() || this.isProduction();
  }

  public shouldUseMinimalCloud(): boolean {
    return this.isStaging();
  }

  public shouldUseFullCloud(): boolean {
    return this.isProduction();
  }

  public getDatabaseConfig() {
    if (this.isDevelopment()) {
      return {
        useLocal: true,
        connectionPoolSize: 10,
        connectionTimeout: 5000,
      };
    } else if (this.isStaging()) {
      return {
        useLocal: false,
        connectionPoolSize: 5,
        connectionTimeout: 10000,
      };
    } else {
      return {
        useLocal: false,
        connectionPoolSize: 20,
        connectionTimeout: 10000,
      };
    }
  }

  public getRedisConfig() {
    if (this.isDevelopment()) {
      return {
        useLocal: true,
        enableCache: true,
        cacheTTL: 900,
      };
    } else if (this.isStaging()) {
      return {
        useLocal: false,
        enableCache: true,
        cacheTTL: 300,
      };
    } else {
      return {
        useLocal: false,
        enableCache: true,
        cacheTTL: 600,
      };
    }
  }

  public getLogLevel(): 'error' | 'warn' | 'info' | 'debug' {
    if (this.isDevelopment()) {
      return 'debug';
    } else if (this.isStaging()) {
      return 'info';
    } else {
      return 'warn';
    }
  }

  public getEventPublisherType(): 'mock' | 'sns' {
    if (this.isDevelopment() && !process.env.LOCALSTACK_ENDPOINT) {
      return 'mock';
    }
    return 'sns';
  }
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return EnvironmentConfig.getInstance();
}

