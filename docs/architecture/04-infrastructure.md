# Infrastructure Components

## Table of Contents

1. [Overview](#overview)
2. [Databases](#databases)
3. [Caching Layer](#caching-layer)
4. [Message Queue & Event Bus](#message-queue--event-bus)
5. [LocalStack](#localstack)
6. [Development Tools](#development-tools)

---

## Overview

The infrastructure layer provides the foundation for all services. It includes databases, caching, message queues, and development tools.

---

## Databases

### Architecture: Database Per Service

Each microservice has its **own dedicated database**. This is a core microservices principle.

### PostgreSQL Databases

#### Auth Service Database (`auth_db`)

**Port**: `5433` (local), configurable in production  
**Purpose**: Stores authentication and authorization data

**Tables**:
- `users` - User accounts with credentials
- `roles` - RBAC roles (user, admin, etc.)
- `user_roles` - User-role assignments
- `refresh_tokens` - JWT refresh tokens
- `password_reset_tokens` - Password reset tokens
- `email_verification_tokens` - Email verification tokens
- `security_audit_logs` - Security event logs
- `rate_limits` - Rate limiting tracking (optional)

**Connection String**:
```
postgresql://auth_user:auth_pass@localhost:5433/auth_db
```

**Production Configuration**:
```
postgresql://user:pass@host:5432/auth_db?connection_limit=20&pool_timeout=10
```

#### User Service Database (`user_db`)

**Port**: `5435` (local), configurable in production  
**Purpose**: Stores user profile and e-commerce data

**Tables**:
- `user_profiles` - User profile information
- `addresses` - User addresses
- `payment_methods` - Payment methods
- `user_preferences` - User preferences
- `wishlist_items` - Wishlist items
- `event_logs` - Event processing logs

**Connection String**:
```
postgresql://user_user:user_pass@localhost:5435/user_db
```

### Database Management

**ORM**: Prisma  
**Migrations**: Prisma Migrate  
**Schema Location**: `services/{service}/prisma/schema.prisma`

**Migration Commands**:
```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:migrate:deploy

# Open Prisma Studio (GUI)
npm run prisma:studio
```

### Connection Pooling

Configured via `DATABASE_URL` query parameters:

```
postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10&connect_timeout=10
```

**Recommended Settings by Environment**:
- **Development**: `connection_limit=10`, `pool_timeout=5`, `connect_timeout=5`
- **Staging**: `connection_limit=5`, `pool_timeout=10`, `connect_timeout=10` (cost-optimized)
- **Production**: `connection_limit=20`, `pool_timeout=10`, `connect_timeout=10`

The codebase automatically configures these based on `NODE_ENV`. See [Environment Configuration](../environment-configuration.md).

---

## Caching Layer

### Redis

**Purpose**: Distributed caching and rate limiting

**Port**: `6379`  
**Image**: `redis:7-alpine`

### Use Cases

1. **Distributed Rate Limiting**
   - Shared rate limit state across service instances
   - Prevents rate limit bypass by using multiple instances

2. **Data Caching**
   - User data caching with environment-based TTL:
     - Development: 15 minutes
     - Staging: 5 minutes (cost-optimized)
     - Production: 10 minutes
   - Frequently accessed data
   - Reduces database load

3. **Session Storage** (Future)
   - Can store session data
   - Distributed session management

### Configuration

**Connection**: `REDIS_URL=redis://localhost:6379`

**Optional**: If Redis is unavailable, services fall back to:
- In-memory rate limiting
- No caching (direct database access)

### Cache Implementation

```typescript
// infrastructure/cache/RedisCache.ts
export class RedisCache {
  async get<T>(key: string): Promise<T | null>
  async set(key: string, value: any, ttl: number): Promise<void>
  async del(key: string): Promise<void>
  async healthCheck(): Promise<HealthResult>
}
```

**Cache Keys Pattern**:
- `user:id:{userId}` - User by ID
- `user:email:{email}` - User by email
- `rl:{identifier}` - Rate limit tracking

---

## Message Queue & Event Bus

### AWS SNS (Simple Notification Service)

**Purpose**: Event publishing (Pub/Sub pattern)

**Local Development**: LocalStack emulation  
**Production**: Real AWS SNS

### How It Works

1. **Auth Service** publishes events to SNS topics
2. **SNS** distributes events to subscribers
3. **User Service** subscribes via SQS queue
4. **Asynchronous processing** - services don't block

### Event Topics

```
user.created                    - New user registered
user.email.verification.requested - Email verification requested
user.password.reset.requested   - Password reset requested
user.deactivated                - Account deactivated
```

### Event Structure

```typescript
{
  userId: string;
  email: string;
  timestamp: string;
  source: 'auth-service';
  // ... event-specific data
}
```

### Configuration

**Local Development**:
```bash
LOCALSTACK_ENDPOINT=http://localhost:4566
EVENT_PUBLISHER_TYPE=sns  # or 'mock' for testing
```

**Production**:
```bash
AWS_REGION=us-east-1
EVENT_PUBLISHER_TYPE=sns
# AWS credentials via IAM role or environment variables
```

---

### AWS SQS (Simple Queue Service)

**Purpose**: Event consumption (Queue pattern)

**Local Development**: LocalStack emulation  
**Production**: Real AWS SQS

### How It Works

1. **SNS** sends events to **SQS queue**
2. **User Service** polls SQS queue
3. **Processes events** asynchronously
4. **Acknowledges** successful processing

### Queue Configuration

```bash
SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/queue-name
AWS_REGION=us-east-1
```

### Event Consumer

```typescript
// infrastructure/events/SQSEventConsumer.ts
export class SQSEventConsumer implements IEventConsumer {
  async start(): Promise<void>
  async stop(): Promise<void>
  subscribe(eventType: string, handler: EventHandler): void
}
```

---

## LocalStack

**Purpose**: Local AWS services emulation for development

**Port**: `4566` (Edge Port)  
**Image**: `localstack/localstack:latest`

### Services Emulated

- **SNS** (Simple Notification Service)
- **SQS** (Simple Queue Service)

### Configuration

```yaml
# docker-compose.dev.yml
localstack:
  environment:
    - SERVICES=sns,sqs
    - DEBUG=0
    - PERSISTENCE=1
```

### Auto-Detection

Services automatically detect LocalStack:

```typescript
// If LOCALSTACK_ENDPOINT is set → use LocalStack
// Otherwise → use real AWS (production)
```

**Benefits**:
- ✅ No AWS account needed for local development
- ✅ Fast iteration
- ✅ Cost-free development
- ✅ Same code works in production

---

## Development Tools

### Adminer

**Purpose**: Web-based database management

**Port**: `8080`  
**URL**: http://localhost:8080

**Features**:
- Browse databases
- Run SQL queries
- Manage tables
- View data

**Access**:
- Server: `postgres-auth` (or `postgres-user`, `postgres-product`)
- Username: `auth_user` (or `user_user`, `product_user`)
- Password: `auth_pass` (or `user_pass`, `product_pass`)
- Database: `auth_db` (or `user_db`, `product_db`)

### Prisma Studio

**Purpose**: Visual database browser

**Command**:
```bash
cd services/auth-service
npm run prisma:studio
```

**Access**: http://localhost:5555

---

## Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ Auth Service │  │User Service  │  │Product Service││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘│
│         │                 │                  │         │
└─────────┼─────────────────┼──────────────────┼─────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Databases                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  auth_db     │  │  user_db     │  │ product_db   ││
│  │  (Port 5433) │  │  (Port 5435) │  │  (Port 5434) ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────┘
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │
                            ▼
              ┌──────────────────────┐
              │   Redis Cache        │
              │   (Port 6379)        │
              └──────────────────────┘
                            │
                            ▼
              ┌──────────────────────┐
              │   LocalStack          │
              │   (Port 4566)         │
              │   - SNS               │
              │   - SQS               │
              └──────────────────────┘
```

---

## Production Considerations

### Database

- ✅ Use managed PostgreSQL (RDS, Aurora)
- ✅ Enable automated backups
- ✅ Configure connection pooling
- ✅ Set up read replicas for scaling
- ✅ Monitor query performance

### Redis

- ✅ Use managed Redis (ElastiCache)
- ✅ Enable persistence (RDB/AOF)
- ✅ Configure high availability
- ✅ Set up replication
- ✅ Monitor memory usage

### AWS Services

- ✅ Use real AWS SNS/SQS in production
- ✅ Configure IAM roles properly
- ✅ Set up dead-letter queues
- ✅ Monitor queue depth
- ✅ Set up CloudWatch alarms

---

## Next Steps

- [Communication Patterns](./05-communication.md) - Learn how services communicate
- [Security Architecture](./06-security.md) - Understand security implementation

