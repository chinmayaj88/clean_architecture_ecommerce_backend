# Clean Architecture

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Layers](#architecture-layers)
3. [Dependency Rule](#dependency-rule)
4. [Layer Details](#layer-details)
5. [Benefits](#benefits)

---

## Introduction

I used **Clean Architecture** (also called Hexagonal Architecture or Ports and Adapters) to keep business logic independent from frameworks, databases, and external services.

### The Main Rule

> **Dependencies point inward**: Outer layers depend on inner layers, but inner layers never depend on outer layers.

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

This is where the business logic lives - no frameworks, no databases, just pure logic.

**Contains**:
- **Entities**: Domain models like User, Role, Address
- **Use Cases**: The actual business logic
  - `RegisterUserUseCase`
  - `LoginUseCase`
  - `CreateAddressUseCase`
  - etc.

**Key points**:
- No Express, no Prisma, no external libraries
- Just TypeScript/JavaScript
- Easy to test in isolation
- Can swap out frameworks without touching this layer

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

Defines the contracts (interfaces) that the core layer depends on. This is where dependency inversion happens.

**Contains**:
- **Interfaces**: Repository and service interfaces
  - `IUserRepository`
  - `IPasswordHasher`
  - `ITokenService`
  - `IEventPublisher`
- **DTOs**: Request/response data structures
  - `LoginRequest`
  - `RegisterRequest`
  - etc.

**What it does**:
- Defines *what* we need, not *how* it's implemented
- Core layer uses these interfaces
- Infrastructure layer implements them
- This lets us swap implementations without changing core logic

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

This layer coordinates use cases and handles HTTP stuff - request parsing, response formatting, etc.

**Contains**:
- **Controllers**: Handle HTTP requests and call use cases
  - `AuthController`
  - `UserController`
- **DTOs**: Request/response structures
- **Utils**: Helper functions for responses, validation

**What it does**:
- Calls use cases from the core layer
- Handles HTTP-specific stuff (Express requests/responses)
- Validates incoming requests
- Formats responses
- No business logic here - just coordination

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

This is where all the framework-specific code lives - Prisma, Express, Redis, AWS SDK, etc.

**Contains**:
- **Database**: Prisma repositories that implement the port interfaces
  - `PrismaUserRepository`
  - `PrismaAddressRepository`
- **External Services**: AWS SDK, Redis, etc.
  - `SNSEventPublisher`
  - `RedisCache`
  - `AuthServiceClient`
- **Framework stuff**: Express middleware, logging
  - `errorHandler.middleware.ts`
  - `rateLimiter.middleware.ts`
  - `logger.ts`

**What it does**:
- Implements the interfaces from the ports layer
- All the framework-specific code is here
- Can swap out Prisma for TypeORM, Express for Fastify, etc. without touching core
- Handles technical details like database connections, caching, etc.

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

### 1. Easy to Test
- Can test business logic without setting up databases or HTTP servers
- Just mock the interfaces
- Tests run fast

### 2. Framework Independent
- Business logic doesn't care about Express or Prisma
- Want to switch from Prisma to TypeORM? Just change the infrastructure layer
- Core logic stays the same

### 3. Maintainable
- Clear boundaries - you know where everything belongs
- Easy to understand the structure
- Changes are isolated to specific layers

### 4. Team Friendly
- Teams can work on different layers without conflicts
- Clear contracts (interfaces) between layers
- Less merge conflict headaches

### 5. Flexible
- Swap implementations easily (Prisma → TypeORM, Express → Fastify)
- Add features without breaking existing code
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

**The key point**: The core layer has no idea about Prisma or AWS. It only knows about the interfaces!

---

## Next Steps

- [Services Architecture](./03-services.md) - See how services are structured
- [Infrastructure](./04-infrastructure.md) - Learn about infrastructure components

