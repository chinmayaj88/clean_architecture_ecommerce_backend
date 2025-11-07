# Development Guide

## Table of Contents

1. [Overview](#overview)
2. [Architectural Excellence](#architectural-excellence)
3. [Independent Development](#independent-development)
4. [Service Structure](#service-structure)
5. [Development Workflow](#development-workflow)
6. [Best Practices](#best-practices)
7. [Team Collaboration](#team-collaboration)
8. [Testing Strategy](#testing-strategy)

---

## Overview

This repository is architected to enable **independent, parallel development** by multiple developers and teams. Each service is self-contained, follows **Clean Architecture** principles, and can be developed, tested, and deployed independently.

### Key Design Goals

- ✅ **Independent Development**: Developers can work on services without blocking each other
- ✅ **Clear Boundaries**: Well-defined interfaces between services
- ✅ **Testability**: Easy to test in isolation
- ✅ **Scalability**: Services can scale independently
- ✅ **Maintainability**: Clear structure and patterns throughout

---

## Architectural Excellence

### 1. Clean Architecture Implementation

This project demonstrates mastery of **Clean Architecture** principles:

#### Layer Separation

```
┌─────────────────────────────────────────────────────────┐
│  Routes Layer (Express)                                 │
│  - HTTP endpoints                                        │
│  - Request/Response handling                            │
└───────────────────────┬─────────────────────────────────┘
                        │ Depends on
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Application Layer (Controllers, DTOs)                │
│  - Request validation                                  │
│  - Response formatting                                 │
│  - Use case orchestration                              │
└───────────────────────┬─────────────────────────────────┘
                        │ Depends on
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Core Layer (Business Logic)                           │
│  - Entities (Domain models)                            │
│  - Use Cases (Business rules)                          │
│  - Pure business logic, no framework dependencies      │
└───────────────────────┬─────────────────────────────────┘
                        │ Depends on
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Ports Layer (Interfaces)                              │
│  - Repository interfaces                                │
│  - Service interfaces                                  │
│  - Dependency inversion contracts                      │
└───────────────────────┬─────────────────────────────────┘
                        │ Implemented by
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Layer (Implementations)                 │
│  - Prisma repositories                                 │
│  - Redis cache                                         │
│  - AWS SNS/SQS                                         │
│  - External service clients                            │
└─────────────────────────────────────────────────────────┘
```

#### Benefits

- **Framework Independence**: Business logic doesn't depend on Express, Prisma, or any framework
- **Easy Testing**: Mock interfaces instead of databases/external services
- **Technology Flexibility**: Swap Prisma for TypeORM, Express for Fastify, etc.
- **Clear Dependencies**: Dependencies always point inward

### 2. SOLID Principles

Every service demonstrates **SOLID** principles:

#### Single Responsibility Principle (SRP)

Each class/component has one reason to change:

```typescript
// ✅ Good: Single responsibility
class CreateUserUseCase {
  execute(data: CreateUserDTO): Promise<User> {
    // Only handles user creation logic
  }
}

class PrismaUserRepository {
  create(data: User): Promise<User> {
    // Only handles database persistence
  }
}
```

#### Open/Closed Principle (OCP)

Open for extension, closed for modification:

```typescript
// ✅ Good: Extend via interfaces, not modification
interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
}

// Can add new implementations without changing existing code
class MongoDBUserRepository implements IUserRepository { }
class PrismaUserRepository implements IUserRepository { }
```

#### Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types:

```typescript
// ✅ Good: All implementations follow the contract
interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
}

// Redis and Memory cache are interchangeable
class RedisCacheService implements ICacheService { }
class MemoryCacheService implements ICacheService { }
```

#### Interface Segregation Principle (ISP)

Clients shouldn't depend on interfaces they don't use:

```typescript
// ✅ Good: Separate interfaces for different concerns
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

interface IUserWriter {
  create(user: User): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

// Services only depend on what they need
class UserService {
  constructor(
    private reader: IUserRepository,
    private writer: IUserWriter
  ) {}
}
```

#### Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions:

```typescript
// ✅ Good: Depend on interface, not implementation
class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository,  // Interface, not PrismaUserRepository
    private eventPublisher: IEventPublisher    // Interface, not SNSClient
  ) {}
}
```

### 3. Domain-Driven Design (DDD)

Services are organized around **business capabilities**:

- **Auth Service**: Authentication & Authorization domain
- **User Service**: User Profile & Preferences domain
- **Product Service**: Product Catalog domain
- **Order Service**: Order Management domain
- **Payment Service**: Payment Processing domain

Each service owns its domain and data.

---

## Independent Development

### Service Isolation

Each service is **completely independent**:

#### 1. Separate Databases

```yaml
# Each service has its own database
auth-service:
  database: auth_db (port 5433)

user-service:
  database: user_db (port 5435)

product-service:
  database: product_db (port 5437)
```

**Benefits**:
- No database conflicts between developers
- Independent schema evolution
- Independent scaling
- Fault isolation

#### 2. Separate Codebases

```
services/
├── auth-service/          # Independent codebase
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── user-service/          # Independent codebase
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
└── product-service/       # Independent codebase
    └── ...
```

**Benefits**:
- No code conflicts
- Independent versioning
- Independent deployment
- Team ownership

#### 3. Independent Dependencies

Each service manages its own dependencies:

```json
// services/auth-service/package.json
{
  "dependencies": {
    "express": "^4.21.2",
    "@prisma/client": "^6.1.0",
    "bcryptjs": "^2.4.3"
  }
}

// services/user-service/package.json
{
  "dependencies": {
    "express": "^4.21.2",
    "@prisma/client": "^6.1.0",
    "zod": "^3.24.1"  // Different dependencies
  }
}
```

**Benefits**:
- No dependency conflicts
- Upgrade services independently
- Use different versions if needed

#### 4. Independent Testing

Each service can be tested in isolation:

```typescript
// services/auth-service/src/core/use-cases/CreateUserUseCase.test.ts
describe('CreateUserUseCase', () => {
  it('should create user', async () => {
    // Mock repository - no database needed
    const mockRepo = {
      create: jest.fn().mockResolvedValue(mockUser)
    };
    
    const useCase = new CreateUserUseCase(mockRepo);
    const result = await useCase.execute(userData);
    
    expect(result).toBeDefined();
  });
});
```

**Benefits**:
- Fast unit tests (no database)
- No test interference
- Parallel test execution

---

## Service Structure

### Standard Service Layout

Every service follows the same structure:

```
service-name/
├── src/
│   ├── core/                    # Business logic (framework-independent)
│   │   ├── entities/            # Domain models
│   │   └── use-cases/           # Business rules
│   ├── application/             # Application layer
│   │   ├── controllers/         # Request handlers
│   │   └── utils/               # Application utilities
│   ├── infrastructure/           # External dependencies
│   │   ├── database/            # Prisma repositories
│   │   ├── cache/               # Redis cache
│   │   ├── events/              # Event publishers/consumers
│   │   └── health/              # Health checks
│   ├── ports/                   # Interfaces (dependency inversion)
│   │   ├── interfaces/          # Repository/service interfaces
│   │   └── dtos/                # Data transfer objects
│   ├── middleware/              # Express middleware
│   ├── routes/                  # Route definitions
│   ├── di/                      # Dependency injection
│   │   └── container.ts         # IoC container
│   ├── config/                  # Configuration
│   │   └── env.ts               # Environment validation
│   └── index.ts                 # Service entry point
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── package.json
├── tsconfig.json
└── .env                         # Service-specific config
```

### Why This Structure?

1. **Predictable**: Developers know where to find code
2. **Scalable**: Easy to add new features
3. **Testable**: Clear separation enables easy testing
4. **Maintainable**: Changes are localized

---

## Development Workflow

### 1. Setting Up a New Service

```bash
# 1. Create service directory
mkdir services/new-service
cd services/new-service

# 2. Initialize package.json
npm init -y

# 3. Install dependencies
npm install express @prisma/client zod
npm install -D typescript @types/node @types/express ts-node

# 4. Initialize Prisma
npx prisma init

# 5. Copy structure from existing service
# (Use auth-service or user-service as template)
```

### 2. Working on a Service Independently

```bash
# Developer A working on auth-service
cd services/auth-service
npm install
npm run dev

# Developer B working on user-service (different terminal)
cd services/user-service
npm install
npm run dev

# No conflicts! Services run on different ports
```

### 3. Database Migrations

```bash
# Each service manages its own migrations
cd services/auth-service
npx prisma migrate dev --name add_feature

# Migrations are independent
cd services/user-service
npx prisma migrate dev --name add_feature  # No conflict!
```

### 4. Testing

```bash
# Test individual service
cd services/auth-service
npm test

# Test all services
npm test  # From root (if configured)
```

---

## Best Practices

### 1. Interface-First Development

Define interfaces before implementations:

```typescript
// ✅ Good: Define interface first
// ports/interfaces/IUserRepository.ts
export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
}

// Then implement
// infrastructure/database/PrismaUserRepository.ts
export class PrismaUserRepository implements IUserRepository {
  // Implementation
}
```

### 2. Use Case Pattern

Each business operation is a use case:

```typescript
// ✅ Good: One use case per operation
export class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(data: CreateUserDTO): Promise<User> {
    // 1. Validate input
    // 2. Business logic
    // 3. Persist
    // 4. Publish events
    // 5. Return result
  }
}
```

### 3. Dependency Injection

Use IoC container for dependencies:

```typescript
// ✅ Good: Dependencies injected via container
export class Container {
  private userRepository: IUserRepository;
  
  constructor() {
    // Wire dependencies
    this.userRepository = new PrismaUserRepository(this.prisma);
  }
  
  getCreateUserUseCase(): CreateUserUseCase {
    return new CreateUserUseCase(
      this.userRepository,
      this.eventPublisher
    );
  }
}
```

### 4. Error Handling

Consistent error handling:

```typescript
// ✅ Good: Custom error types
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

// Use in use cases
if (!user) {
  throw new UserNotFoundError(userId);
}
```

### 5. Event-Driven Communication

Services communicate via events:

```typescript
// ✅ Good: Publish events for cross-service communication
await this.eventPublisher.publish({
  eventType: 'user.created',
  payload: { userId: user.id, email: user.email }
});

// Other services consume events asynchronously
```

---

## Team Collaboration

### 1. Service Ownership

Each team owns specific services:

```
Team A: Auth Service, User Service
Team B: Product Service, Cart Service
Team C: Order Service, Payment Service
```

**Benefits**:
- Clear ownership
- Reduced conflicts
- Faster development
- Better code quality

### 2. API Contracts

Services communicate via well-defined APIs:

```typescript
// ✅ Good: OpenAPI/Swagger for API contracts
// openapi.yaml
paths:
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
```

**Benefits**:
- Clear contracts
- Easy integration
- Documentation
- Versioning

### 3. Event Contracts

Events follow a standard format:

```typescript
// ✅ Good: Standardized event format
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  occurredAt: Date;
  payload: Record<string, any>;
}
```

### 4. Code Review

Review process focuses on:
- Architecture compliance
- SOLID principles
- Test coverage
- Documentation

---

## Testing Strategy

### 1. Unit Tests

Test business logic in isolation:

```typescript
// ✅ Good: Test use cases with mocks
describe('CreateUserUseCase', () => {
  it('should create user', async () => {
    const mockRepo = createMockRepository();
    const useCase = new CreateUserUseCase(mockRepo);
    
    const result = await useCase.execute(userData);
    
    expect(mockRepo.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
```

### 2. Integration Tests

Test service integration:

```typescript
// ✅ Good: Test with real database
describe('UserRepository Integration', () => {
  it('should persist user', async () => {
    const repo = new PrismaUserRepository(prisma);
    const user = await repo.create(userData);
    
    const found = await repo.findById(user.id);
    expect(found).toEqual(user);
  });
});
```

### 3. Contract Tests

Test API contracts:

```typescript
// ✅ Good: Test API endpoints
describe('GET /users/:id', () => {
  it('should return user', async () => {
    const response = await request(app)
      .get('/users/123')
      .expect(200);
    
    expect(response.body).toMatchSchema(userSchema);
  });
});
```

---

## Architectural Skills Demonstrated

### 1. Microservices Architecture

- ✅ Service decomposition
- ✅ Database per service
- ✅ Event-driven communication
- ✅ Independent deployment

### 2. Clean Architecture

- ✅ Layer separation
- ✅ Dependency inversion
- ✅ Framework independence
- ✅ Testability

### 3. SOLID Principles

- ✅ Single Responsibility
- ✅ Open/Closed
- ✅ Liskov Substitution
- ✅ Interface Segregation
- ✅ Dependency Inversion

### 4. Design Patterns

- ✅ Repository Pattern
- ✅ Use Case Pattern
- ✅ Dependency Injection
- ✅ Factory Pattern
- ✅ Observer Pattern (Events)

### 5. Production Readiness

- ✅ Health checks
- ✅ Graceful shutdown
- ✅ Error handling
- ✅ Logging
- ✅ Monitoring
- ✅ Rate limiting
- ✅ Caching

---

## Quick Reference

### Starting Development

```bash
# 1. Start infrastructure
make dev

# 2. Setup databases
make setup-all

# 3. Start service
cd services/auth-service
npm run dev
```

### Common Commands

```bash
# Database
npx prisma migrate dev        # Create migration
npx prisma studio             # Open database GUI
npx prisma generate           # Generate Prisma client

# Development
npm run dev                   # Start development server
npm run build                 # Build for production
npm test                      # Run tests

# Code Quality
npm run lint                  # Lint code
npm run format                # Format code
```

---

## Conclusion

This repository demonstrates:

1. **Architectural Excellence**: Clean Architecture, SOLID principles, DDD
2. **Independent Development**: Services can be developed in parallel
3. **Scalability**: Services scale independently
4. **Maintainability**: Clear structure and patterns
5. **Production Readiness**: Health checks, monitoring, error handling

Developers can work independently on services without conflicts, enabling fast, parallel development while maintaining high code quality and architectural integrity.

---

**Last Updated**: 2025  
**Architecture Version**: 2.2 (Real-World Features Implementation)

## Real-World Features

All three implemented services (Auth, User, Product) now include comprehensive real-world features:

### Auth Service
- ✅ Multi-Factor Authentication (MFA/TOTP)
- ✅ Device Management
- ✅ Login History & Activity Tracking
- ✅ Session Management
- ✅ IP-based Security & Suspicious Login Detection

### User Service
- ✅ Recently Viewed Products
- ✅ User Activity Tracking & Analytics
- ✅ Profile Completion Score
- ✅ Granular Notification Preferences
- ✅ Privacy Settings & GDPR Compliance

### Product Service
- ✅ Advanced Search with Filters
- ✅ Product Recommendations Engine
- ✅ Product Q&A Section
- ✅ Review Moderation Workflow
- ✅ Product Badges
- ✅ Stock Alerts
- ✅ Product View Tracking
- ✅ Product Comparisons

See [FEATURES_SUMMARY.md](../../FEATURES_SUMMARY.md) for complete documentation of all features and API endpoints.

