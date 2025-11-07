# Clean Architecture

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Layers](#architecture-layers)
3. [Dependency Rule](#dependency-rule)
4. [Layer Details](#layer-details)
5. [Benefits](#benefits)

---

## Introduction

This project follows **Clean Architecture** principles, also known as **Hexagonal Architecture** or **Ports and Adapters**. The architecture ensures that business logic remains independent of frameworks, databases, and external services.

### Core Principle

> **Dependency Rule**: Dependencies point inward. Outer layers depend on inner layers, but inner layers never depend on outer layers.

---

## Architecture Layers

Each service follows a layered architecture with clear boundaries:

```
┌─────────────────────────────────────────────────────────┐
│                    Routes Layer                          │
│              (Express Routes, HTTP)                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 Application Layer                        │
│         (Controllers, DTOs, Request Handling)             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Core Layer                            │
│         (Entities, Use Cases, Business Logic)            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Ports Layer                           │
│              (Interfaces, Contracts)                     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                        │
│    (Prisma, Express, Redis, AWS SDK, External APIs)      │
└─────────────────────────────────────────────────────────┘
```

---

## Layer Details

### 1. Core Layer (`src/core/`)

**Purpose**: Pure business logic with no external dependencies

**Contains**:
- **Entities**: Domain models (User, Role, Address, etc.)
- **Use Cases**: Business logic implementations
  - `RegisterUserUseCase`
  - `LoginUseCase`
  - `CreateAddressUseCase`
  - etc.

**Characteristics**:
- ✅ No framework dependencies
- ✅ No database dependencies
- ✅ No HTTP dependencies
- ✅ Pure TypeScript/JavaScript
- ✅ Testable in isolation

**Example**:
```typescript
// core/entities/User.ts
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  // ... business rules
}

// core/use-cases/LoginUseCase.ts
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,  // Interface!
    private readonly passwordHasher: IPasswordHasher,   // Interface!
    private readonly tokenService: ITokenService        // Interface!
  ) {}
  
  async execute(request: LoginRequest) {
    // Pure business logic
  }
}
```

---

### 2. Ports Layer (`src/ports/`)

**Purpose**: Define contracts/interfaces (Dependency Inversion Principle)

**Contains**:
- **Interfaces**: Repository interfaces, service interfaces
  - `IUserRepository`
  - `IPasswordHasher`
  - `ITokenService`
  - `IEventPublisher`
- **DTOs**: Data Transfer Objects for API contracts
  - `LoginRequest`
  - `RegisterRequest`
  - etc.

**Characteristics**:
- ✅ Defines what, not how
- ✅ Used by Core layer
- ✅ Implemented by Infrastructure layer
- ✅ Enables dependency inversion

**Example**:
```typescript
// ports/interfaces/IUserRepository.ts
export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  // ... other methods
}

// Core uses interface
// Infrastructure implements interface
```

---

### 3. Application Layer (`src/application/`)

**Purpose**: Orchestrates use cases and handles HTTP concerns

**Contains**:
- **Controllers**: HTTP request/response handling
  - `AuthController`
  - `UserController`
- **DTOs**: Request/Response data structures
- **Utils**: Response helpers, validators

**Characteristics**:
- ✅ Coordinates use cases
- ✅ Handles HTTP concerns
- ✅ Validates requests
- ✅ Formats responses
- ✅ Framework-aware but business-logic-free

**Example**:
```typescript
// application/controllers/AuthController.ts
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}
  
  async login(req: Request, res: Response): Promise<void> {
    const request: LoginRequest = {
      email: req.body.email,
      password: req.body.password,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
    
    const result = await this.loginUseCase.execute(request);
    sendSuccess(res, 200, 'Login successful', result);
  }
}
```

---

### 4. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: Framework-specific implementations

**Contains**:
- **Database**: Prisma repositories
  - `PrismaUserRepository`
  - `PrismaAddressRepository`
- **External Services**: AWS SDK, Redis, etc.
  - `SNSEventPublisher`
  - `RedisCache`
  - `AuthServiceClient`
- **Framework**: Express middleware, logging, etc.
  - `errorHandler.middleware.ts`
  - `rateLimiter.middleware.ts`
  - `logger.ts`

**Characteristics**:
- ✅ Implements Port interfaces
- ✅ Framework-specific code
- ✅ Can be swapped without changing Core
- ✅ Handles technical concerns

**Example**:
```typescript
// infrastructure/database/PrismaUserRepository.ts
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}
  
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? this.mapToEntity(user) : null;
  }
}
```

---

### 5. Routes Layer (`src/routes/`)

**Purpose**: Define API endpoints and apply middleware

**Contains**:
- Route definitions
- Middleware application
- Request validation
- OpenAPI annotations

**Example**:
```typescript
// routes/auth.routes.ts
export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();
  
  router.post(
    '/login',
    authRateLimiter,
    validate([...]),
    (req, res, next) => {
      controller.login(req, res).catch(next);
    }
  );
  
  return router;
}
```

---

## Dependency Rule

### The Rule

**Dependencies must point inward only.**

```
Routes → Application → Core ← Ports ← Infrastructure
```

### What This Means

1. **Core** depends on **nothing** (except standard libraries)
2. **Application** depends on **Core** and **Ports**
3. **Infrastructure** depends on **Ports** (implements interfaces)
4. **Routes** depends on **Application** and **Infrastructure** (middleware)

### Violation Example ❌

```typescript
// ❌ BAD: Core importing Prisma
import { PrismaClient } from '@prisma/client';

export class LoginUseCase {
  constructor(private prisma: PrismaClient) {}  // ❌ Violates dependency rule
}
```

### Correct Example ✅

```typescript
// ✅ GOOD: Core using interface
import { IUserRepository } from '../../ports/interfaces/IUserRepository';

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) {}  // ✅ Depends on abstraction
}
```

---

## Dependency Injection Container

The DI Container (`src/di/container.ts`) wires everything together:

```typescript
export class Container {
  private constructor() {
    // Infrastructure implementations
    this.userRepository = new PrismaUserRepository(this.prisma);
    this.passwordHasher = new BcryptPasswordHasher();
    
    // Use cases (Core) - depend on interfaces
    this.loginUseCase = new LoginUseCase(
      this.userRepository,      // IUserRepository
      this.passwordHasher,      // IPasswordHasher
      this.tokenService,        // ITokenService
      // ...
    );
    
    // Controllers (Application) - depend on use cases
    this.authController = new AuthController(
      this.loginUseCase,
      // ...
    );
  }
}
```

**Benefits**:
- Single place to configure dependencies
- Easy to swap implementations
- Testable (can inject mocks)
- Follows Inversion of Control principle

---

## Benefits

### 1. Testability
- Core logic can be tested without databases or HTTP
- Mock interfaces easily
- Fast unit tests

### 2. Framework Independence
- Business logic doesn't depend on Express, Prisma, etc.
- Can swap frameworks without changing Core
- Easy to migrate to different technologies

### 3. Maintainability
- Clear boundaries and responsibilities
- Easy to understand code structure
- Changes are localized

### 4. Team Collaboration
- Teams can work on different layers independently
- Clear contracts between layers
- Reduced merge conflicts

### 5. Flexibility
- Swap implementations (Prisma → TypeORM)
- Add new features without breaking existing code
- Easy to extend

---

## Real-World Example

### User Registration Flow

1. **Route** (`routes/auth.routes.ts`)
   - Receives HTTP POST `/register`
   - Applies middleware (rate limiting, validation)

2. **Controller** (`application/controllers/AuthController.ts`)
   - Extracts request data
   - Calls use case
   - Formats response

3. **Use Case** (`core/use-cases/RegisterUserUseCase.ts`)
   - Validates business rules
   - Calls repository (via interface)
   - Publishes event (via interface)
   - Returns result

4. **Repository** (`infrastructure/database/PrismaUserRepository.ts`)
   - Implements `IUserRepository`
   - Saves to database using Prisma
   - Returns domain entity

5. **Event Publisher** (`infrastructure/events/SNSEventPublisher.ts`)
   - Implements `IEventPublisher`
   - Publishes to AWS SNS
   - Handles errors

**Key Point**: Core layer doesn't know about Prisma or AWS. It only knows about interfaces!

---

## Next Steps

- [Services Architecture](./03-services.md) - See how services are structured
- [Infrastructure](./04-infrastructure.md) - Learn about infrastructure components

