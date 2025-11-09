# Architecture Overview

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Documentation Structure](#documentation-structure)

---

## Introduction

This doc gives an overview of the e-commerce microservices platform architecture. I built it using microservices principles, Clean Architecture, and event-driven design to make it scalable and maintainable.

### Key Principles

- **Microservices**: Each service can be deployed and scaled independently
- **Clean Architecture**: Business logic is separated from frameworks
- **Event-Driven**: Services communicate asynchronously via AWS SNS/SQS
- **Domain-Driven**: Services are organized around business capabilities
- **SOLID**: Applied throughout to keep the code maintainable
- **Production-Ready**: Includes security, monitoring, and error handling

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                      │
│              (Web, Mobile, API Consumers)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Future)                      │
│              (Routing, Rate Limiting, Auth)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Auth Service │ │User Service  │ │Product Service│
│   (Port 3001)│ │  (Port 3002) │ │  (Port 3003) │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                 │
       │                │                 │
       ▼                ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PostgreSQL   │ │ PostgreSQL   │ │ PostgreSQL   │
│  (Auth DB)   │ │  (User DB)   │ │ (Product DB) │
└──────────────┘ └──────────────┘ └──────────────┘
       │                │                 │
       └────────────────┼─────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   Redis Cache    │
              │  (Distributed)  │
              └──────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  AWS SNS/SQS     │
              │  (Event Bus)     │
              └──────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │Notification Service│
              │  (Future)         │
              └──────────────────┘
```

### How Services Communicate

1. **HTTP (synchronous)**: Direct service calls when needed (e.g., user-service calls auth-service for RBAC checks)
2. **Events (asynchronous)**: Services publish/consume events via SNS/SQS
3. **No Shared Databases**: Each service has its own database - no sharing
4. **API Gateway**: Not implemented yet, but planned for unified API access

---

## Documentation Structure

This architecture documentation is organized into the following sections:

### Core Architecture Documents

- **[01-overview.md](./01-overview.md)** - This file: High-level system overview
- **[02-clean-architecture.md](./02-clean-architecture.md)** - Clean Architecture principles and implementation
- **[03-services.md](./03-services.md)** - Detailed service architecture
- **[04-infrastructure.md](./04-infrastructure.md)** - Infrastructure components (Databases, Cache, etc.)
- **[05-communication.md](./05-communication.md)** - Service communication patterns
- **[06-security.md](./06-security.md)** - Security architecture and implementation
- **[07-data-flow.md](./07-data-flow.md)** - Data flow and event processing
- **[08-technology-stack.md](./08-technology-stack.md)** - Complete technology stack

### Quick Reference

- **[README.md](./README.md)** - Quick navigation and index

---

## Key Characteristics

### Scalability

- Each service can scale independently (horizontal scaling)
- Services are stateless - no session state stored in the service
- Redis caching for better performance
- Each service has its own database, so they can scale independently

### Reliability

- Health check endpoints (`/health` and `/ready`) for monitoring
- Graceful shutdown - properly cleans up connections
- Centralized error handling with structured logging
- Circuit breakers are planned but not implemented yet

### Security

- JWT tokens for stateless authentication
- RBAC for authorization
- Account lockout after failed login attempts
- Security audit logging for tracking sensitive operations
- CORS protection with configurable origins
- Rate limiting using Redis

### Maintainability

- Clean Architecture keeps things organized
- TypeScript for type safety
- Dependency injection for loose coupling
- Structured logging with request IDs for tracing
- OpenAPI docs auto-generated from code

---

## Next Steps

Continue reading:
1. [Clean Architecture](./02-clean-architecture.md) - Understand the code structure
2. [Services](./03-services.md) - Learn about individual services
3. [Infrastructure](./04-infrastructure.md) - Explore infrastructure components
4. [Communication](./05-communication.md) - Understand how services interact

