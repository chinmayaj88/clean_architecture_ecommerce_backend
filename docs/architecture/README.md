# Architecture Documentation

Welcome to the Architecture Documentation for the E-Commerce Microservices Platform.

## 📚 Documentation Index

### Core Architecture Documents

1. **[Overview](./01-overview.md)**
   - System architecture overview
   - Key principles and characteristics
   - High-level architecture diagram

2. **[Clean Architecture](./02-clean-architecture.md)**
   - Architecture layers explained
   - Dependency rule and principles
   - Code structure and organization

3. **[Services](./03-services.md)**
   - Auth Service architecture
   - User Service architecture
   - Service responsibilities and APIs

4. **[Infrastructure](./04-infrastructure.md)**
   - PostgreSQL databases
   - Redis caching
   - AWS SNS/SQS
   - LocalStack
   - Development tools

5. **[Communication](./05-communication.md)**
   - Synchronous HTTP communication
   - Asynchronous event-driven communication
   - Service interaction patterns

6. **[Security](./06-security.md)**
   - Authentication (JWT)
   - Authorization (RBAC)
   - Account security (lockout)
   - API security (CORS, rate limiting)
   - Security audit logging

7. **[Data Flow](./07-data-flow.md)**
   - User registration flow
   - User login flow
   - Profile management flow
   - Event processing
   - Data consistency

8. **[Technology Stack](./08-technology-stack.md)**
   - Complete technology list
   - Version information
   - Purpose of each technology

9. **[Database Architecture](./database/README.md)**
   - Database per service pattern
   - Individual service database designs
   - ER diagrams for all services
   - Cross-service references
   - Production optimization strategies

10. **[Repository Organization](./REPOSITORY_ORGANIZATION.md)**
    - Repository structure and organization
    - Services in this repo vs separate repo
    - Communication between repositories
    - Migration strategy

---

## 🎯 Quick Start

**New to the architecture?** Start here:
1. Read [Overview](./01-overview.md) for high-level understanding
2. Read [Clean Architecture](./02-clean-architecture.md) to understand code structure
3. Read [Services](./03-services.md) to learn about individual services

**Want to understand how things work together?**
1. Read [Communication](./05-communication.md) for service interaction
2. Read [Data Flow](./07-data-flow.md) for end-to-end flows
3. Read [Infrastructure](./04-infrastructure.md) for infrastructure details

**Security-focused?**
1. Read [Security](./06-security.md) for complete security architecture

---

## 📖 Reading Order

### For Developers
1. Overview → Clean Architecture → Services → Technology Stack

### For Architects
1. Overview → Clean Architecture → Communication → Data Flow → Infrastructure

### For Security Engineers
1. Overview → Security → Services → Infrastructure

### For DevOps Engineers
1. Overview → Infrastructure → Services → Technology Stack

---

## 🔍 Document Details

Each document includes:
- ✅ Clear explanations
- ✅ Code examples
- ✅ Diagrams and flowcharts
- ✅ Configuration examples
- ✅ Best practices
- ✅ Production considerations

---

## 📝 Document Structure

All documents follow this structure:
- **Table of Contents** - Easy navigation
- **Overview** - Introduction to the topic
- **Detailed Sections** - In-depth explanations
- **Examples** - Real-world examples
- **Next Steps** - Links to related documents

---

## 🚀 Getting Started

1. **Understand the System**: Start with [Overview](./01-overview.md)
2. **Learn the Code Structure**: Read [Clean Architecture](./02-clean-architecture.md)
3. **Explore Services**: Check [Services](./03-services.md)
4. **Understand Infrastructure**: See [Infrastructure](./04-infrastructure.md)

---

## 📞 Additional Resources

- **Development Setup**: See `docs/development/`
- **Deployment Guide**: See `docs/deployment/`
- **Main README**: See root `README.md`

---

**Last Updated**: 2024  
**Architecture Version**: 1.0

