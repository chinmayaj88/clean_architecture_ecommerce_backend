# Services Architecture

## Table of Contents

1. [Overview](#overview)
2. [Auth Service](#auth-service)
3. [User Service](#user-service)
4. [Service Independence](#service-independence)
5. [Service Responsibilities](#service-responsibilities)

---

## Overview

The platform consists of multiple microservices, each responsible for a specific business domain. Each service is:

- **Independently deployable**
- **Independently scalable**
- **Has its own database**
- **Follows Clean Architecture**
- **Communicates via HTTP and Events**

---

## Auth Service

**Port**: `3001`  
**Database**: PostgreSQL (`auth_db`)  
**Purpose**: Authentication, authorization, and user session management

### Responsibilities

1. **User Authentication**
   - User registration
   - Login/logout
   - Password management (reset, change)
   - Email verification

2. **Authorization**
   - JWT token generation and validation
   - Refresh token management
   - Role-Based Access Control (RBAC)
   - Token refresh

3. **Security**
   - Account lockout after failed attempts
   - Security audit logging
   - Password hashing (bcrypt)
   - Session management

4. **Event Publishing**
   - Publishes `user.created` events
   - Publishes `user.deactivated` events
   - Publishes password reset events

### Key Components

#### Core Domain Entities
- `User` - User account information
- `Role` - RBAC roles (user, admin, etc.)
- `RefreshToken` - JWT refresh tokens
- `PasswordResetToken` - Password reset tokens
- `EmailVerificationToken` - Email verification tokens
- `SecurityAuditLog` - Security event logs

#### Use Cases
- `RegisterUserUseCase` - User registration
- `LoginUseCase` - User authentication with lockout protection
- `RefreshTokenUseCase` - Token refresh
- `LogoutUseCase` - Session termination
- `ForgotPasswordUseCase` - Password reset initiation
- `ResetPasswordUseCase` - Password reset completion
- `VerifyEmailUseCase` - Email verification
- `ChangePasswordUseCase` - Password change
- `DeactivateAccountUseCase` - Account deactivation

#### Infrastructure
- **Database**: Prisma ORM with PostgreSQL
- **Caching**: Redis (optional, for rate limiting)
- **Events**: AWS SNS (or LocalStack for local dev)
- **Security**: bcryptjs, jsonwebtoken

### API Endpoints

```
POST   /api/v1/auth/register              - Register new user
POST   /api/v1/auth/login                 - Login user
POST   /api/v1/auth/refresh               - Refresh access token
POST   /api/v1/auth/logout                - Logout user
POST   /api/v1/auth/forgot-password       - Request password reset
POST   /api/v1/auth/reset-password        - Reset password
POST   /api/v1/auth/verify-email           - Verify email address
POST   /api/v1/auth/resend-verification   - Resend verification email
POST   /api/v1/auth/change-password        - Change password (authenticated)
POST   /api/v1/auth/deactivate            - Deactivate account (authenticated)
GET    /health                            - Health check
GET    /ready                             - Readiness check
GET    /api-docs                          - OpenAPI documentation
```

### Database Schema

```sql
-- Core Tables
users                          -- User accounts
roles                          -- RBAC roles
user_roles                     -- User-role assignments
refresh_tokens                 -- JWT refresh tokens
password_reset_tokens         -- Password reset tokens
email_verification_tokens      -- Email verification tokens
security_audit_logs            -- Security event logs
rate_limits                    -- Rate limiting (optional)
```

### Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@host:5432/auth_db

# JWT
JWT_SECRET=<32+ char secret>
JWT_REFRESH_SECRET=<32+ char secret>
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# Redis (optional)
REDIS_URL=redis://localhost:6379

# AWS SNS
AWS_REGION=us-east-1
EVENT_PUBLISHER_TYPE=sns
LOCALSTACK_ENDPOINT=http://localhost:4566  # Local dev only
```

---

## User Service

**Port**: `3002`  
**Database**: PostgreSQL (`user_db`)  
**Purpose**: User profile management and e-commerce features

### Responsibilities

1. **User Profile Management**
   - Create/read/update user profiles
   - User preferences
   - Profile information (name, phone, avatar, etc.)

2. **Address Management**
   - CRUD operations for user addresses
   - Multiple addresses per user
   - Default address selection

3. **Payment Methods**
   - CRUD operations for payment methods
   - Multiple payment methods per user
   - Secure storage (tokenization in production)

4. **Wishlist Management**
   - Add/remove items from wishlist
   - Retrieve user wishlist

5. **Event Consumption**
   - Consumes `user.created` events from auth-service
   - Creates user profile when user registers

### Key Components

#### Core Domain Entities
- `UserProfile` - User profile information
- `Address` - User addresses
- `PaymentMethod` - Payment methods
- `UserPreference` - User preferences
- `WishlistItem` - Wishlist items

#### Use Cases
- `CreateUserProfileUseCase` - Create profile (from event)
- `GetUserProfileUseCase` - Get user profile
- `UpdateUserProfileUseCase` - Update profile
- `CreateAddressUseCase` - Add address
- `GetAddressesUseCase` - Get user addresses
- `UpdateAddressUseCase` - Update address
- `DeleteAddressUseCase` - Delete address
- `CreatePaymentMethodUseCase` - Add payment method
- `UpdatePaymentMethodUseCase` - Update payment method
- `DeletePaymentMethodUseCase` - Delete payment method
- `AddToWishlistUseCase` - Add to wishlist
- `GetWishlistUseCase` - Get wishlist
- `HandleUserCreatedEventUseCase` - Process user.created event

#### Infrastructure
- **Database**: Prisma ORM with PostgreSQL
- **Caching**: Redis (optional)
- **Events**: AWS SQS consumer (or LocalStack)
- **Auth**: HTTP client to auth-service for RBAC

### API Endpoints

```
GET    /api/v1/users/:userId              - Get user profile
PUT    /api/v1/users/:userId              - Update user profile
POST   /api/v1/users/:userId/addresses    - Create address
GET    /api/v1/users/:userId/addresses    - Get addresses
PUT    /api/v1/users/:userId/addresses/:id - Update address
DELETE /api/v1/users/:userId/addresses/:id - Delete address
POST   /api/v1/users/:userId/payment-methods - Create payment method
PUT    /api/v1/users/:userId/payment-methods/:id - Update payment method
DELETE /api/v1/users/:userId/payment-methods/:id - Delete payment method
POST   /api/v1/users/:userId/wishlist    - Add to wishlist
GET    /api/v1/users/:userId/wishlist    - Get wishlist
GET    /health                           - Health check
GET    /ready                            - Readiness check
GET    /api-docs                         - OpenAPI documentation
```

### Database Schema

```sql
-- Core Tables
user_profiles              -- User profile information
addresses                  -- User addresses
payment_methods           -- Payment methods
user_preferences           -- User preferences
wishlist_items             -- Wishlist items
event_logs                 -- Event processing logs
```

### Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3002

# Database
DATABASE_URL=postgresql://user:pass@host:5432/user_db

# Auth Service Integration
AUTH_SERVICE_URL=http://auth-service:3001
AUTH_SERVICE_API_KEY=<optional-api-key>

# Redis (optional)
REDIS_URL=redis://localhost:6379

# AWS SQS
SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/queue
AWS_REGION=us-east-1
LOCALSTACK_ENDPOINT=http://localhost:4566  # Local dev only
```

---

## Service Independence

### Database Per Service

Each service has its **own database**:
- ✅ No shared databases
- ✅ Independent schema evolution
- ✅ Independent scaling
- ✅ Data isolation

### Communication

Services communicate via:
1. **HTTP REST APIs** (synchronous)
   - User-service → Auth-service for RBAC
   - Configurable via `AUTH_SERVICE_URL`

2. **Event-Driven** (asynchronous)
   - Auth-service publishes events → SNS
   - User-service consumes events → SQS
   - Loose coupling, eventual consistency

### Deployment Independence

Each service can be:
- ✅ Deployed independently
- ✅ Scaled independently
- ✅ Updated independently
- ✅ Rolled back independently

---

## Service Responsibilities

### Auth Service

**Owns**:
- User authentication data
- JWT tokens
- Roles and permissions
- Security audit logs

**Does NOT Own**:
- User profile data
- User addresses
- Payment methods
- Wishlist items

### User Service

**Owns**:
- User profile data
- Addresses
- Payment methods
- Wishlist items

**Does NOT Own**:
- Authentication credentials
- JWT tokens
- Roles (reads from JWT)

---

## Service Interaction Flow

### User Registration Flow

```
1. Client → Auth Service: POST /register
2. Auth Service:
   - Creates user in auth_db
   - Generates JWT tokens
   - Publishes "user.created" event → SNS
3. User Service (async):
   - Consumes "user.created" event ← SQS
   - Creates user profile in user_db
4. Response to Client:
   - Access token + refresh token
```

### User Login Flow

```
1. Client → Auth Service: POST /login
2. Auth Service:
   - Validates credentials
   - Checks account lockout
   - Generates JWT tokens
   - Logs security event
3. Response to Client:
   - Access token + refresh token
```

### Get User Profile Flow

```
1. Client → User Service: GET /users/:userId
   - Includes JWT token in Authorization header
2. User Service:
   - Validates JWT (decodes locally)
   - Checks RBAC permissions
   - Fetches profile from user_db
3. Response to Client:
   - User profile data
```

---

## Next Steps

- [Infrastructure](./04-infrastructure.md) - Learn about databases, cache, etc.
- [Communication](./05-communication.md) - Understand service communication patterns

