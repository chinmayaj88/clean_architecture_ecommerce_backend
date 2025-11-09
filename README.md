# E-Commerce Microservices Platform

A microservices-based e-commerce platform I built to showcase my skills in system architecture and backend development. It uses clean architecture principles and follows SOLID design patterns throughout.

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

I built this project to demonstrate my ability to architect and build a production-grade microservices system. Here's what I focused on:

- **Microservices Architecture**: Designed with service decomposition, event-driven communication, and independent deployment
- **Clean Architecture**: Kept business logic separated from frameworks and infrastructure
- **SOLID Principles**: Applied throughout the codebase for maintainability
- **Production Features**: Added health checks, graceful shutdown, caching, rate limiting, and proper error handling
- **Real-world Features**: Implemented features you'd see in actual e-commerce platforms like MFA, device management, session tracking, product recommendations, reviews, Q&A, and more

**Tech Stack**: TypeScript, Node.js 22+, Express, PostgreSQL 16+, Prisma, Redis, Docker, AWS SNS/SQS (with LocalStack for local dev)

The platform includes features like MFA/TOTP authentication, device management, login history tracking, suspicious login detection, product recommendations, review systems with moderation, stock alerts, and GDPR compliance tools.

---

## 📋 Overview

This is a monorepo with multiple microservices that work together to form an e-commerce platform.

**Environment Setup**: The code handles three environments automatically:
- **Development** - Everything runs locally with Docker and LocalStack
- **Staging** - Uses minimal cloud resources to keep costs down
- **Production** - Full cloud infrastructure setup

More details in the [Environment Configuration](./docs/environment-configuration.md) docs.

Each service uses **Clean Architecture** with these layers:
- **Core**: Pure business logic (entities, use cases) - no framework dependencies
- **Application**: Controllers and request handling
- **Infrastructure**: Database, caching, external services
- **Ports**: Interfaces for dependency inversion

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

**Important:** Make sure you have the `.env` files set up in:
- `services/auth-service/.env`
- `services/user-service/.env`

These contain database URLs, JWT secrets, Redis config, AWS credentials, etc. Check the service READMEs for what variables are needed.

### Step 3: Start Infrastructure Services

**Linux/Mac/Windows:**
```bash
make dev
```

This starts PostgreSQL databases, Redis, and LocalStack (AWS emulation) using Docker.

This starts up:
- PostgreSQL databases (auth-service on 5433, user-service on 5435)
- Redis cache (port 6379)
- LocalStack for AWS emulation (port 4566)

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

This will:
- Generate Prisma clients
- Run database migrations
- Seed initial data (for auth-service)

### Step 5: Build All Services

**Linux/Mac/Windows:**
```bash
make build
```

This compiles all services and generates Prisma clients.

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

I organized it this way to keep business logic separate from frameworks:

- `core/` - Business logic only, no Express/Prisma dependencies
- `application/` - Controllers that orchestrate use cases
- `infrastructure/` - Actual implementations (Prisma, Redis, etc.)
- `ports/` - Interfaces that define contracts between layers

**Why it helps:**
- Easy to test - can mock interfaces instead of real databases
- Business logic doesn't depend on Express or Prisma
- Can swap out implementations (e.g., switch from Prisma to TypeORM) without touching core logic
- Clear boundaries make it easier for teams to work in parallel

**SOLID principles applied:**
- Single Responsibility: Each use case does one thing
- Dependency Inversion: Core depends on interfaces, not concrete classes

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

Each service needs its own `.env` file with database URLs, secrets, etc. Check the individual service directories for what's required.

**Environment modes:**
- Set `NODE_ENV=development|staging|production` to switch between environments
- Development = local Docker containers
- Staging = minimal cloud setup (cheaper)
- Production = full cloud infrastructure

See [Environment Configuration](./docs/environment-configuration.md) for all the details.

**⚠️ Never commit `.env` files** - they have secrets!

### Health Checks

- Health: `GET /health` - Service health status
- Readiness: `GET /ready` - Kubernetes readiness probe

### API Documentation

- Auth Service: http://localhost:3001/api-docs
- User Service: http://localhost:3002/api-docs

---

## 🏗️ Architecture Highlights

- **Event-Driven**: Services communicate asynchronously via SNS/SQS
- **Caching**: Redis for performance (user data, sessions, etc.)
- **Rate Limiting**: Distributed rate limiting using Redis
- **Connection Pooling**: Prisma handles database connections
- **Graceful Shutdown**: Properly cleans up connections on shutdown
- **Request Tracing**: Request IDs for tracking requests across services
- **Logging**: Structured JSON logs for easier debugging and monitoring

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

Ready to go? Run `make setup-all` and you should be good! 🚀

---

## 📚 Development Documentation

The architecture supports independent development - teams can work on different services without stepping on each other. Each service follows Clean Architecture and can be built, tested, and deployed separately.

### What's in the docs:

- **[Development Guide](./docs/development/01-development-guide.md)** - How to work with the codebase
- **[Architecture Docs](./docs/architecture/README.md)** - System design and patterns
- **[Database Docs](./docs/architecture/database/README.md)** - Database schemas and relationships

### What I focused on:

1. **Microservices**: Each service has its own database and communicates via events
2. **Clean Architecture**: Business logic is framework-independent
3. **SOLID Principles**: Applied throughout to keep things maintainable
4. **Design Patterns**: Repository, Use Cases, DI, etc.
5. **Production Features**: Health checks, logging, error handling, graceful shutdown

Check out the [Development Guide](./docs/development/01-development-guide.md) for more details on the architecture and how to contribute.
