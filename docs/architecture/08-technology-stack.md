# Technology Stack

## Table of Contents

1. [Runtime & Language](#runtime--language)
2. [Frameworks & Libraries](#frameworks--libraries)
3. [Databases](#databases)
4. [Caching](#caching)
5. [Message Queue](#message-queue)
6. [Cloud Services](#cloud-services)
7. [Development Tools](#development-tools)
8. [Infrastructure](#infrastructure)

---

## Runtime & Language

### Node.js
- **Version**: >= 18.0.0
- **Purpose**: JavaScript runtime
- **Why**: Fast, scalable, large ecosystem

### TypeScript
- **Version**: ^5.3.3
- **Purpose**: Type-safe JavaScript
- **Why**: Type safety, better IDE support, fewer bugs

---

## Frameworks & Libraries

### Express.js
- **Version**: ^4.18.2
- **Purpose**: Web framework
- **Features Used**:
  - Routing
  - Middleware
  - Request/Response handling

### Prisma
- **Version**: ^5.9.1
- **Purpose**: ORM and database toolkit
- **Features**:
  - Type-safe database access
  - Migrations
  - Query builder
  - Prisma Studio (GUI)

### Zod
- **Version**: ^3.22.4
- **Purpose**: Schema validation
- **Use**: Environment variable validation

### Winston
- **Version**: ^3.11.0
- **Purpose**: Logging
- **Features**: Structured JSON logging, file transports

### Helmet
- **Version**: ^7.1.0
- **Purpose**: Security headers
- **Protection**: XSS, clickjacking, content-type sniffing

### Express Validator
- **Version**: ^7.0.1
- **Purpose**: Request validation
- **Features**: Input validation, sanitization

### Express Rate Limit
- **Version**: ^7.1.5
- **Purpose**: Rate limiting
- **Backend**: Redis (distributed) or in-memory

---

## Databases

### PostgreSQL
- **Version**: 15-alpine
- **Purpose**: Primary database
- **Configuration**: One database per service
- **Features Used**:
  - ACID transactions
  - JSON support
  - Full-text search (future)

### Prisma Client
- **Purpose**: Type-safe database client
- **Features**:
  - Auto-generated types
  - Query optimization
  - Connection pooling

---

## Caching

### Redis
- **Version**: 7-alpine
- **Purpose**: Distributed caching and rate limiting
- **Use Cases**:
  - User data caching
  - Distributed rate limiting
  - Session storage (future)

### ioredis
- **Version**: ^5.3.2
- **Purpose**: Redis client for Node.js
- **Features**: Connection pooling, cluster support

---

## Message Queue

### AWS SNS (Simple Notification Service)
- **Purpose**: Event publishing (Pub/Sub)
- **Local**: LocalStack emulation
- **Production**: Real AWS SNS
- **Use**: Asynchronous event distribution

### AWS SQS (Simple Queue Service)
- **Purpose**: Event consumption (Queue)
- **Local**: LocalStack emulation
- **Production**: Real AWS SQS
- **Use**: Reliable event processing

### AWS SDK
- **Version**: ^2.1692.0
- **Purpose**: AWS service integration
- **Services Used**: SNS, SQS

---

## Security

### jsonwebtoken
- **Version**: ^9.0.2
- **Purpose**: JWT token generation and validation
- **Use**: Authentication tokens

### bcryptjs
- **Version**: ^2.4.3
- **Purpose**: Password hashing
- **Algorithm**: bcrypt with salt

### cookie-parser
- **Version**: ^1.4.6
- **Purpose**: Cookie parsing
- **Use**: Refresh token storage

---

## API Documentation

### Swagger UI Express
- **Version**: ^5.0.1
- **Purpose**: API documentation UI
- **Source**: OpenAPI YAML files

### yamljs
- **Version**: ^0.3.0
- **Purpose**: YAML parsing
- **Use**: Load OpenAPI specifications

---

## Development Tools

### TypeScript Compiler
- **Purpose**: TypeScript to JavaScript compilation
- **Configuration**: `tsconfig.json`

### ts-node-dev
- **Version**: ^2.0.0
- **Purpose**: Development server with hot reload
- **Use**: `npm run dev`

### ESLint
- **Purpose**: Code linting
- **Configuration**: `.eslintrc`

### Prettier
- **Purpose**: Code formatting
- **Configuration**: `.prettierrc`

---

## Infrastructure

### Docker
- **Purpose**: Containerization
- **Use**: Local development environment

### Docker Compose
- **Purpose**: Multi-container orchestration
- **Use**: Local infrastructure setup

### LocalStack
- **Purpose**: AWS services emulation
- **Services**: SNS, SQS
- **Port**: 4566

### Adminer
- **Purpose**: Database management UI
- **Port**: 8080
- **Use**: Browse and query databases

---

## HTTP Client

### Axios
- **Version**: ^1.6.2
- **Purpose**: HTTP client
- **Use**: Service-to-service communication (user-service → auth-service)

---

## Utilities

### UUID
- **Version**: ^9.0.1
- **Purpose**: Unique identifier generation
- **Use**: Request IDs, event IDs

### connect-timeout
- **Version**: ^1.9.0
- **Purpose**: Request timeout handling
- **Use**: Prevent long-running requests

---

## Testing (Future)

### Jest
- **Version**: ^29.7.0
- **Purpose**: Testing framework
- **Status**: Configured, tests to be written

### Supertest
- **Version**: ^6.3.4
- **Purpose**: HTTP assertion library
- **Use**: API endpoint testing

---

## Technology Stack Summary

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js 4.18+
- **ORM**: Prisma 5.9+

### Databases
- **Primary**: PostgreSQL 15
- **Cache**: Redis 7

### Cloud Services (Production)
- **Events**: AWS SNS/SQS
- **Storage**: AWS S3 (future)
- **Monitoring**: AWS CloudWatch (future)

### Security
- **Authentication**: JWT (jsonwebtoken)
- **Password**: bcryptjs
- **Headers**: Helmet
- **Rate Limiting**: express-rate-limit + Redis

### Development
- **Local AWS**: LocalStack
- **Database UI**: Adminer, Prisma Studio
- **Linting**: ESLint
- **Formatting**: Prettier

---

## Version Compatibility

All packages are tested and compatible with:
- Node.js: >= 18.0.0
- npm: >= 9.0.0
- TypeScript: ^5.3.3

---

## Production Considerations

### Recommended Versions
- Use LTS versions of Node.js
- Keep dependencies updated
- Monitor security advisories
- Use dependency scanning tools

### Performance
- Connection pooling configured
- Redis caching enabled
- Rate limiting active
- Request timeouts configured

---

## Next Steps

- [Overview](./01-overview.md) - Return to architecture overview
- [Clean Architecture](./02-clean-architecture.md) - Understand code structure

