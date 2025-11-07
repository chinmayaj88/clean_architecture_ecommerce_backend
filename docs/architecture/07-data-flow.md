# Data Flow & Event Processing

## Table of Contents

1. [Overview](#overview)
2. [User Registration Flow](#user-registration-flow)
3. [User Login Flow](#user-login-flow)
4. [Profile Management Flow](#profile-management-flow)
5. [Event Processing](#event-processing)
6. [Data Consistency](#data-consistency)

---

## Overview

This document describes how data flows through the system, including synchronous operations and asynchronous event processing.

---

## User Registration Flow

### Complete Flow Diagram

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ POST /api/v1/auth/register
     │ { email, password }
     ▼
┌─────────────────────────────────┐
│      Auth Service               │
│  ┌───────────────────────────┐  │
│  │ 1. Validate Input         │  │
│  │    - Email format         │  │
│  │    - Password strength    │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 2. Check Email Exists     │  │
│  │    → Query auth_db        │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 3. Hash Password          │  │
│  │    → bcrypt.hash()       │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 4. Create User            │  │
│  │    → INSERT INTO users   │  │
│  │    → Assign 'user' role  │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 5. Generate Tokens        │  │
│  │    → Access token (15m)   │  │
│  │    → Refresh token (7d)   │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 6. Store Refresh Token   │  │
│  │    → INSERT INTO         │  │
│  │      refresh_tokens       │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 7. Create Email Token     │  │
│  │    → INSERT INTO         │  │
│  │      email_verification_  │  │
│  │      tokens               │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 8. Publish Event          │  │
│  │    → SNS: user.created    │  │
│  └───────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │
               │ Response: { accessToken, refreshToken, user }
               ▼
          ┌─────────┐
          │ Client  │
          └─────────┘

               │
               │ Event: user.created
               ▼
┌─────────────────────────────────┐
│         AWS SNS                 │
│    (Topic: user.created)        │
└───────────┬─────────────────────┘
            │
            │ Distributes to subscribers
            ▼
┌─────────────────────────────────┐
│         AWS SQS                 │
│    (Queue: user-service-queue) │
└───────────┬─────────────────────┘
            │
            │ Polls queue
            ▼
┌─────────────────────────────────┐
│      User Service                │
│  ┌───────────────────────────┐  │
│  │ 1. Receive Event          │  │
│  │    ← SQS: user.created    │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 2. Extract Data           │  │
│  │    { userId, email }      │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 3. Create User Profile    │  │
│  │    → INSERT INTO         │  │
│  │      user_profiles        │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 4. Acknowledge Message    │  │
│  │    → Delete from SQS     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Step-by-Step Breakdown

#### Synchronous Steps (Auth Service)

1. **Request Validation**
   - Email format validation
   - Password strength validation
   - Input sanitization

2. **Business Logic**
   - Check if email exists
   - Hash password with bcrypt
   - Create user record
   - Assign default role

3. **Token Generation**
   - Generate JWT access token
   - Generate JWT refresh token
   - Store refresh token in database

4. **Response**
   - Return tokens to client
   - Set refresh token as HTTP-only cookie

#### Asynchronous Steps (User Service)

1. **Event Consumption**
   - User Service polls SQS queue
   - Receives `user.created` event

2. **Profile Creation**
   - Extract `userId` and `email` from event
   - Create user profile record
   - Initialize default preferences

3. **Acknowledgment**
   - Acknowledge message processing
   - Message removed from queue

### Timing

- **Synchronous**: ~200-500ms (database operations)
- **Asynchronous**: ~1-5 seconds (event processing)
- **Eventual Consistency**: User profile available within seconds

---

## User Login Flow

### Complete Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ POST /api/v1/auth/login
     │ { email, password }
     │ IP: 192.168.1.1
     │ User-Agent: Mozilla/5.0...
     ▼
┌─────────────────────────────────┐
│      Auth Service                │
│  ┌───────────────────────────┐  │
│  │ 1. Find User by Email      │  │
│  │    → Query auth_db         │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 2. Check Account Lockout  │  │
│  │    → If locked_until > NOW│  │
│  │    → Reject with message  │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 3. Check Account Status    │  │
│  │    → If !isActive: Reject │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 4. Verify Password         │  │
│  │    → bcrypt.compare()      │  │
│  └───────────┬───────────────┘  │
│              │                   │
│         ┌────┴────┐             │
│         │         │             │
│      Valid?    Invalid?         │
│         │         │             │
│         ▼         ▼             │
│    ┌────────┐ ┌──────────────┐ │
│    │Success │ │   Failure    │ │
│    └────┬───┘ └──────┬───────┘ │
│         │            │         │
│         │            ▼         │
│         │    ┌──────────────┐  │
│         │    │Increment     │  │
│         │    │failed_       │  │
│         │    │attempts      │  │
│         │    └──────┬───────┘  │
│         │           │          │
│         │           ▼          │
│         │    ┌──────────────┐  │
│         │    │Check if >=   │  │
│         │    │MAX_ATTEMPTS  │  │
│         │    └──────┬───────┘  │
│         │           │          │
│         │      ┌────┴────┐    │
│         │      │         │    │
│         │    Yes?      No?    │
│         │      │         │    │
│         │      ▼         ▼    │
│         │ ┌────────┐ ┌──────┐ │
│         │ │Lock    │ │Log   │ │
│         │ │Account │ │Event │ │
│         │ └────────┘ └──────┘ │
│         │                     │
│         ▼                     │
│  ┌───────────────────────────┐ │
│  │ 5. Reset Failed Attempts  │ │
│  │    → Set to 0             │ │
│  │    → Set locked_until=NULL│ │
│  └───────────┬───────────────┘ │
│              ▼                   │
│  ┌───────────────────────────┐ │
│  │ 6. Log Security Event      │ │
│  │    → INSERT INTO          │ │
│  │      security_audit_logs  │ │
│  │    → action: login_success│ │
│  └───────────┬───────────────┘ │
│              ▼                   │
│  ┌───────────────────────────┐ │
│  │ 7. Generate Tokens        │ │
│  │    → Access token (15m)   │ │
│  │    → Refresh token (7d)   │ │
│  └───────────┬───────────────┘ │
│              ▼                   │
│  ┌───────────────────────────┐ │
│  │ 8. Store Refresh Token   │ │
│  │    → INSERT INTO         │ │
│  │      refresh_tokens       │ │
│  └───────────┬───────────────┘ │
└──────────────┼──────────────────┘
               │
               │ Response: { accessToken, refreshToken, user }
               ▼
          ┌─────────┐
          │ Client  │
          └─────────┘
```

### Security Checks

1. **Account Lockout Check**
   ```typescript
   if (user.lockedUntil && user.lockedUntil > new Date()) {
     // Account is locked
     throw new Error('Account locked');
   }
   ```

2. **Password Verification**
   ```typescript
   const isValid = await bcrypt.compare(password, user.passwordHash);
   if (!isValid) {
     await incrementFailedAttempts(userId);
     // Check if should lock account
   }
   ```

3. **Security Audit Logging**
   - Log all login attempts (success/failure)
   - Include IP address and user agent
   - Track failed attempts

---

## Profile Management Flow

### Get User Profile

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     │ GET /api/v1/users/:userId
     │ Authorization: Bearer <access_token>
     ▼
┌─────────────────────────────────┐
│      User Service                │
│  ┌───────────────────────────┐  │
│  │ 1. Extract JWT Token      │  │
│  │    → From Authorization  │  │
│  │      header               │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 2. Decode JWT (Local)     │  │
│  │    → Extract userId, roles│  │
│  │    → Verify signature     │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 3. Check RBAC             │  │
│  │    → Own resource?        │  │
│  │    → Has admin role?      │  │
│  └───────────┬───────────────┘  │
│              ▼                   │
│  ┌───────────────────────────┐  │
│  │ 4. Check Cache            │  │
│  │    → Redis: user:id:{id}  │  │
│  └───────────┬───────────────┘  │
│              │                   │
│         ┌────┴────┐             │
│         │         │             │
│      Cache    Cache             │
│      Hit?     Miss?             │
│         │         │             │
│         │         ▼             │
│         │    ┌──────────────┐  │
│         │    │Query Database│  │
│         │    │→ user_db     │  │
│         │    └──────┬───────┘  │
│         │           │          │
│         │           ▼          │
│         │    ┌──────────────┐  │
│         │    │Cache Result │  │
│         │    │→ Redis      │  │
│         │    └──────┬───────┘  │
│         │           │          │
│         └───────────┼──────────┘
│                     ▼
│  ┌───────────────────────────┐ │
│  │ 5. Return Profile         │ │
│  │    → Format response     │ │
│  └───────────┬───────────────┘ │
└──────────────┼──────────────────┘
               │
               │ Response: { user: {...} }
               ▼
          ┌─────────┐
          │ Client  │
          └─────────┘
```

### Update User Profile

```
1. Client → User Service: PUT /users/:userId
   Authorization: Bearer <token>
   Body: { firstName, lastName, ... }
   ↓
2. User Service:
   - Validates JWT token
   - Checks RBAC (own resource or admin)
   - Validates input data
   - Updates profile in database
   - Invalidates cache
   ↓
3. Response: Updated profile
```

---

## Event Processing

### Event Lifecycle

```
┌──────────────┐
│   Publisher  │
│ (Auth Service)│
└──────┬───────┘
       │
       │ 1. Publish Event
       ▼
┌──────────────┐
│     SNS      │
│   (Topic)    │
└──────┬───────┘
       │
       │ 2. Distribute
       ▼
┌──────────────┐
│     SQS      │
│   (Queue)    │
└──────┬───────┘
       │
       │ 3. Poll Queue
       ▼
┌──────────────┐
│   Consumer   │
│(User Service)│
└──────┬───────┘
       │
       │ 4. Process Event
       ▼
┌──────────────┐
│   Database   │
│  (user_db)   │
└──────┬───────┘
       │
       │ 5. Acknowledge
       ▼
┌──────────────┐
│     SQS      │
│ (Delete Msg) │
└──────────────┘
```

### Event Processing Guarantees

**At-Least-Once Delivery**:
- SQS guarantees message delivery
- May receive duplicate events
- **Solution**: Implement idempotency

**Idempotency Example**:
```typescript
async handleUserCreatedEvent(event: UserCreatedEvent) {
  // Check if profile already exists
  const existing = await this.userProfileRepository.findByUserId(event.userId);
  if (existing) {
    logger.info('Profile already exists, skipping', { userId: event.userId });
    return; // Idempotent - safe to process again
  }
  
  // Create profile
  await this.userProfileRepository.create({
    userId: event.userId,
    email: event.email,
    // ...
  });
}
```

### Error Handling

**Retry Strategy**:
1. Process event
2. If error occurs:
   - Log error
   - Don't acknowledge message
   - SQS will retry automatically
3. After max retries:
   - Move to Dead Letter Queue (DLQ)
   - Alert operations team

---

## Data Consistency

### Consistency Models

#### Strong Consistency (Synchronous)

**Use Cases**:
- User authentication
- Token validation
- Critical operations

**Example**: Login requires immediate validation

#### Eventual Consistency (Asynchronous)

**Use Cases**:
- User profile creation
- Non-critical updates
- Cross-service data synchronization

**Example**: User profile created after registration (within seconds)

### Handling Inconsistencies

**Scenario**: User registered but profile not yet created

**Solutions**:
1. **Client Retry**: Client can retry fetching profile
2. **Eventual Consistency**: Profile will be created eventually
3. **Synchronous Fallback**: Can create profile synchronously if needed

**Best Practice**: Design UI to handle eventual consistency gracefully

---

## Data Flow Patterns

### Pattern 1: Request-Response

**Use**: Immediate data needs

```
Client → Service → Database → Service → Client
```

**Example**: Get user profile

### Pattern 2: Event-Driven

**Use**: Decoupled operations

```
Service A → Event → SNS → SQS → Service B → Database
```

**Example**: User registration triggers profile creation

### Pattern 3: Cached Request-Response

**Use**: Frequently accessed data

```
Client → Service → Cache → (if miss) Database → Cache → Client
```

**Example**: Get user profile (cached)

---

## Next Steps

- [Technology Stack](./08-technology-stack.md) - Complete technology overview
- [Clean Architecture](./02-clean-architecture.md) - Code structure details

