# E-Commerce Microservices Platform

A production-ready microservices architecture demonstrating advanced software engineering principles, clean architecture, and SOLID design patterns.

## 📑 Table of Contents

1. [About This Project](#-about-this-project)
2. [Overview](#-overview)
3. [Complete Project Setup](#-complete-project-setup)
4. [Individual Service Setup](#-individual-service-setup)
5. [Folder Structure](#-folder-structure)
6. [Quick Reference](#-quick-reference)
7. [Development Documentation](#-development-documentation)

---

## 🎯 About This Project

This project was built to showcase:

- **Architecting Skills**: Microservices design, event-driven architecture, service decomposition
- **DSA Knowledge**: Efficient algorithms, data structures, and optimization patterns
- **Clean Architecture**: Separation of concerns, dependency inversion, testability
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Production Readiness**: Health checks, graceful shutdown, distributed caching, rate limiting, error handling

**Tech Stack**: TypeScript, Node.js 22+, Express 4.21+, PostgreSQL 16+, Prisma 6.1+, Redis 7.4+, Docker, AWS SNS/SQS, LocalStack

**Real-World Features**: This platform includes production-ready features similar to major e-commerce platforms including MFA/TOTP, device management, login history, session management, suspicious login detection, recently viewed products, activity tracking, profile completion, granular notification preferences, GDPR compliance, advanced search, product recommendations, Q&A, review moderation, stock alerts, product comparisons, and more.

---

## 📋 Overview

This is a monorepo containing **Core E-Commerce Services** that work together to form an e-commerce platform.

**Environment Support**: The codebase automatically configures resources for three environments:
- **Development** - Uses local resources (Docker, LocalStack)
- **Staging** - Uses minimal cloud resources (cost-optimized)
- **Production** - Uses full-scale cloud infrastructure

See [Environment Configuration](./docs/environment-configuration.md) for details.

Each service follows **Clean Architecture** with clear separation between:
- **Core**: Business logic (entities, use cases)
- **Application**: Controllers, DTOs
- **Infrastructure**: Database, external services, caching
- **Ports**: Interfaces (dependency inversion)

---

## 🚀 Complete Project Setup

### Prerequisites

**For Linux/Mac:**
- Node.js >= 22.0.0
- Docker & Docker Compose
- npm >= 10.0.0
- Make (usually pre-installed)

**For Windows:**
- Node.js >= 22.0.0
- Docker Desktop for Windows
- npm >= 10.0.0
- Make for Windows ([GnuWin32](http://gnuwin32.sourceforge.net/packages/make.htm) or use WSL)

**Note:** Ensure you have the required `.env` files before proceeding.

### Step 1: Install Dependencies

**Linux/Mac/Windows:**
```bash
npm install
```

### Step 2: Set Up Environment Variables

**Important:** Before proceeding, ensure you have received the `.env` files and placed them in:
- `services/auth-service/.env`
- `services/user-service/.env`

These files contain all required configuration including database URLs, API keys, and secrets.

### Step 3: Start Infrastructure Services

**Linux/Mac/Windows:**
```bash
make dev
```

This starts PostgreSQL databases, Redis, and LocalStack (AWS emulation) using Docker.

**What happens:**
- PostgreSQL containers for auth-service (port 5433) and user-service (port 5435)
- Redis container (port 6379)
- LocalStack container (port 4566) for AWS services emulation

### Step 4: Set Up Databases

**Linux/Mac/Windows:**
```bash
# Set up all services (runs migrations and seeds data)
make setup-all
```

Or set up individually:
```bash
make setup-auth  # Auth service database (migrations + seed)
make setup-user  # User service database (migrations)
```

**What happens:**
- Prisma clients are generated
- Database migrations are applied
- Seed data is inserted (for auth-service)

### Step 5: Build All Services

**Linux/Mac/Windows:**
```bash
make build
```

This automatically generates Prisma clients and compiles TypeScript for all services.

### Step 6: Start Services

Open separate terminal windows/tabs for each service:

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm run dev
```
Auth service runs on: http://localhost:3001

**Terminal 2 - User Service:**
```bash
cd services/user-service
npm run dev
```
User service runs on: http://localhost:3002

### Step 7: Verify Setup

Check that services are running:
- **Auth Service Health:** http://localhost:3001/health
- **User Service Health:** http://localhost:3002/health
- **Auth Service API Docs:** http://localhost:3001/api-docs

---

## 🔧 Individual Service Setup

Useful when working on a single service (e.g., auth team only working on auth-service).

### Prerequisites for Individual Setup

1. Ensure Docker infrastructure is running: `make dev`
2. Ensure you have the `.env` file for the service (provided by team lead)

### Auth Service Only

**Linux/Mac/Windows:**
```bash
# Navigate to service
cd services/auth-service

# Install dependencies
npm install

# Ensure .env file exists (provided by team lead)
# The .env file should already contain all required variables

# Set up database (migrations + seed)
make migrate-auth
make seed-auth

# Generate Prisma client
npm run prisma:generate

# Build
npm run build

# Run
npm run dev
```

### User Service Only

**Linux/Mac/Windows:**
```bash
cd services/user-service
npm install

# Ensure .env file exists (provided by team lead)

# Set up database
make migrate-user

# Generate Prisma client
npm run prisma:generate

# Build
npm run build

# Run
npm run dev
```

**Note**: For user-service, ensure auth-service is running for RBAC checks.

---

## 📁 Folder Structure

```
ecommerce/
├── services/              # Microservices
│   ├── auth-service/      # Authentication & authorization
│   │   ├── src/
│   │   │   ├── core/          # Business logic (entities, use cases)
│   │   │   ├── application/   # Controllers, DTOs
│   │   │   ├── infrastructure/ # Database, external services
│   │   │   ├── ports/         # Interfaces (dependency inversion)
│   │   │   ├── routes/        # Express routes
│   │   │   ├── middleware/    # Auth, validation, error handling
│   │   │   └── di/            # Dependency injection container
│   │   ├── prisma/        # Database schema & migrations
│   │   └── package.json
│   └── user-service/      # User profiles & preferences
│       └── [same structure]
├── docker-compose.dev.yml # Local infrastructure
├── Makefile              # Common commands
└── package.json         # Workspace root
```

### Why This Structure?

**Clean Architecture Layers**:
- `core/` - Pure business logic, no framework dependencies
- `application/` - Orchestrates use cases, framework-agnostic
- `infrastructure/` - Framework-specific implementations (Prisma, Express)
- `ports/` - Interfaces define contracts (Dependency Inversion Principle)

**Benefits**:
- ✅ Easy to test (mock interfaces)
- ✅ Framework-independent business logic
- ✅ Clear dependencies (inner layers don't depend on outer layers)
- ✅ Easy to swap implementations (e.g., Prisma → TypeORM)
- ✅ Team collaboration (clear boundaries)

**SOLID Principles**:
- Single Responsibility: Each use case has one job
- Open/Closed: Extend via interfaces, not modification
- Dependency Inversion: Depend on abstractions (interfaces), not concrete classes

---

## 📚 Quick Reference

### Common Commands

```bash
# Development
make dev              # Start Docker services
make dev-down         # Stop Docker services
make build            # Build all services
make generate-prisma  # Generate Prisma clients

# Database
make migrate-all      # Run all migrations
make seed-auth        # Seed auth service
make setup-all        # Complete setup (migrate + seed)

# Individual Services
make setup-auth      # Setup auth service
make setup-user      # Setup user service
make studio-auth     # Open Prisma Studio for auth DB
```

### Environment Variables

**Important:** Each service requires a `.env` file:
- `services/auth-service/.env` - Contains database URL, JWT secrets, Redis URL, AWS config, etc.
- `services/user-service/.env` - Contains database URL, auth service URL, Redis URL, etc.

**Environment Configuration:**
- Set `NODE_ENV=development|staging|production` to configure resources automatically
- Development uses local resources (Docker, LocalStack)
- Staging uses minimal cloud resources (cost-optimized)
- Production uses full-scale cloud infrastructure
- See [Environment Configuration](./docs/environment-configuration.md) for details

**Do not commit `.env` files to version control.** They contain sensitive information.

### Health Checks

- Health: `GET /health` - Service health status
- Readiness: `GET /ready` - Kubernetes readiness probe

### API Documentation

- Auth Service: http://localhost:3001/api-docs
- User Service: http://localhost:3002/api-docs

---

## 🏗️ Architecture Highlights

- **Event-Driven**: SNS/SQS for async communication
- **Distributed Caching**: Redis for performance
- **Rate Limiting**: Distributed rate limiting via Redis
- **Connection Pooling**: Database connection management
- **Graceful Shutdown**: Clean resource cleanup
- **Request Tracking**: Request IDs for distributed tracing
- **Structured Logging**: JSON logs for observability

---

## 🪟 Windows-Specific Notes

### Installing Make on Windows

**Option 1: Using GnuWin32**
1. Download Make from [GnuWin32](http://gnuwin32.sourceforge.net/packages/make.htm)
2. Install and add to PATH
3. Restart your terminal

**Option 2: Using WSL (Recommended)**
1. Install Windows Subsystem for Linux (WSL)
2. Use Linux commands within WSL
3. All commands work as documented for Linux/Mac

**Option 3: Using Chocolatey**
```powershell
choco install make
```

### Common Windows Issues

**Issue: "make: command not found"**
- Solution: Install Make using one of the options above

**Issue: PowerShell execution policy errors (npm commands fail)**
- Solution: The Makefile now uses `npm.cmd` and `npx.cmd` to bypass PowerShell execution policy. If you still encounter issues, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell as Administrator

**Issue: Path separators in commands**
- Solution: The Makefile automatically handles Windows paths. Use forward slashes `/` in commands as shown in examples.

---

**Ready to build?** Start with `make setup-all` and you're good to go! 🚀

---

## 📚 Development Documentation

This repository is architected to enable **independent, parallel development** by multiple developers and teams. Each service follows **Clean Architecture** principles and can be developed, tested, and deployed independently.

### Key Highlights

- ✅ **Clean Architecture**: Framework-independent business logic
- ✅ **SOLID Principles**: Applied throughout the codebase
- ✅ **Independent Development**: Services can be developed in parallel without conflicts
- ✅ **Domain-Driven Design**: Services organized around business capabilities
- ✅ **Production Ready**: Health checks, monitoring, error handling, and more

### Documentation

- **[Development Guide](./docs/development/01-development-guide.md)** - Comprehensive guide on architecture, development practices, and team collaboration
- **[Architecture Documentation](./docs/architecture/README.md)** - System architecture and design patterns
- **[Database Documentation](./docs/architecture/database/README.md)** - Database design and schemas

### Architectural Skills Demonstrated

1. **Microservices Architecture**: Service decomposition, database per service, event-driven communication
2. **Clean Architecture**: Layer separation, dependency inversion, framework independence
3. **SOLID Principles**: All five principles applied consistently
4. **Design Patterns**: Repository, Use Case, Dependency Injection, Factory, Observer
5. **Production Readiness**: Health checks, graceful shutdown, error handling, logging, monitoring

See the [Development Guide](./docs/development/01-development-guide.md) for detailed information on how the repository enables independent development and showcases architectural excellence.
