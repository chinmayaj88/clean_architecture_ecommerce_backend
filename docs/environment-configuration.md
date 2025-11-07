# Environment Configuration Guide

This document explains how the codebase automatically configures resources based on the environment (Development, Staging, Production).

**All configuration is automatic** - simply set `NODE_ENV` and the codebase handles the rest. No code changes needed when deploying to different environments.

## Environment Types

The application supports three main environments:

1. **Development** - Uses local resources (LocalStack, local databases, local Redis)
2. **Staging** - Uses minimal cloud resources to cut costs
3. **Production** - Uses full-scale cloud infrastructure

## Automatic Configuration

The codebase automatically detects the environment and configures resources accordingly. No code changes are needed when deploying to different environments.

### Environment Detection

Set `NODE_ENV` to one of:
- `development` - Local development
- `staging` - Staging environment
- `production` - Production environment
- `test` - Testing environment

## Resource Configuration by Environment

### Development Environment

**Database:**
- Uses local PostgreSQL (Docker)
- Connection pool: 10 connections
- Connection timeout: 5 seconds
- Logging: query, error, warn

**Redis:**
- Uses local Redis (Docker)
- Caching enabled
- Cache TTL: 15 minutes (900 seconds)

**AWS Services:**
- Uses LocalStack if `LOCALSTACK_ENDPOINT` is set
- Falls back to Mock publisher if LocalStack not available
- No AWS costs

**Logging:**
- Level: `debug`
- Verbose logging for development

### Staging Environment

**Database:**
- Uses cloud PostgreSQL (small instance)
- Connection pool: 5 connections (reduced to save costs)
- Connection timeout: 10 seconds
- Logging: error, warn only

**Redis:**
- Uses cloud Redis (small instance)
- Caching enabled
- Cache TTL: 5 minutes (300 seconds) - shorter to save memory

**AWS Services:**
- Uses minimal AWS SNS/SQS
- Single region deployment
- Basic monitoring only

**Logging:**
- Level: `info`
- Balanced logging

### Production Environment

**Database:**
- Uses cloud PostgreSQL (scaled instance)
- Connection pool: 20 connections
- Connection timeout: 10 seconds
- Logging: error only

**Redis:**
- Uses cloud Redis (scaled instance)
- Caching enabled
- Cache TTL: 10 minutes (600 seconds)

**AWS Services:**
- Uses full AWS SNS/SQS
- Multi-region deployment
- Full monitoring and alerting

**Logging:**
- Level: `warn`
- Minimal logging for performance

## Environment Variables

### Required for All Environments

```bash
NODE_ENV=development|staging|production
DATABASE_URL=postgresql://...
```

### Development Only

```bash
LOCALSTACK_ENDPOINT=http://localhost:4566  # Optional, for LocalStack
REDIS_URL=redis://localhost:6379
```

### Staging/Production

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
SNS_TOPIC_ARN=arn:aws:sns:...
SQS_QUEUE_URL=https://sqs...
REDIS_URL=redis://cloud-redis-host:6379
```

## How It Works

The `EnvironmentConfig` class automatically detects the environment and provides configuration:

```typescript
import { getEnvironmentConfig } from './config/environment';

const envConfig = getEnvironmentConfig();

// Check environment
envConfig.isDevelopment();  // true in development
envConfig.isStaging();     // true in staging
envConfig.isProduction();  // true in production

// Get configurations
const dbConfig = envConfig.getDatabaseConfig();
const redisConfig = envConfig.getRedisConfig();
const logLevel = envConfig.getLogLevel();
```

## Cost Optimization

### Staging Environment

Staging is configured to minimize costs:
- Smaller database connection pools
- Shorter cache TTLs
- Single region deployment
- Basic monitoring only

### Production Environment

Production uses full resources:
- Larger connection pools
- Longer cache TTLs
- Multi-region deployment
- Full monitoring and alerting

## Deployment

Simply set `NODE_ENV` when deploying:

```bash
# Development
NODE_ENV=development npm start

# Staging
NODE_ENV=staging npm start

# Production
NODE_ENV=production npm start
```

The codebase automatically configures all resources based on the environment. No code changes needed!

