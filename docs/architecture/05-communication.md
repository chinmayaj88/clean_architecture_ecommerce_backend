# Service Communication

## Table of Contents

1. [Overview](#overview)
2. [Synchronous Communication](#synchronous-communication)
3. [Asynchronous Communication](#asynchronous-communication)
4. [Communication Patterns](#communication-patterns)
5. [Event-Driven Architecture](#event-driven-architecture)

---

## Overview

Services in this platform communicate using two main patterns:

1. **Synchronous HTTP** - For immediate responses
2. **Asynchronous Events** - For decoupled, eventual consistency

---

## Synchronous Communication

### HTTP REST APIs

Used when immediate response is required.

### User Service → Auth Service

**Purpose**: RBAC (Role-Based Access Control) verification

**Flow**:
```
User Service receives request with JWT token
    ↓
Decodes JWT token locally (no HTTP call needed)
    ↓
If role verification needed → HTTP call to Auth Service
    ↓
Auth Service validates token and returns role info
    ↓
User Service processes request based on roles
```

**Implementation**:
```typescript
// user-service/src/infrastructure/auth/AuthServiceClient.ts
export class AuthServiceClient implements IAuthServiceClient {
  async verifyToken(token: string): Promise<UserInfo | null> {
    // Currently decodes JWT locally
    // Can be extended to call auth-service endpoint
  }
  
  async getUserRoles(userId: string): Promise<string[]> {
    // Can call: GET /api/v1/auth/users/{userId}/roles
  }
}
```

**Configuration**:
```bash
AUTH_SERVICE_URL=http://auth-service:3001
AUTH_SERVICE_API_KEY=<optional-for-service-auth>
```

**Characteristics**:
- ✅ Immediate response
- ✅ Strong consistency
- ⚠️ Creates coupling between services
- ⚠️ Service must be available

**When to Use**:
- Authentication/authorization checks
- Critical operations requiring immediate validation
- Operations that need synchronous confirmation

---

## Asynchronous Communication

### Event-Driven Architecture

Used for decoupled, eventually consistent operations.

### Architecture Pattern: Pub/Sub

```
┌──────────────┐
│ Auth Service │
│  (Publisher) │
└──────┬───────┘
       │
       │ Publishes Event
       ▼
┌──────────────┐
│  AWS SNS     │
│  (Topic)     │
└──────┬───────┘
       │
       │ Distributes
       ▼
┌──────────────┐
│  AWS SQS     │
│  (Queue)     │
└──────┬───────┘
       │
       │ Consumes
       ▼
┌──────────────┐
│ User Service │
│ (Consumer)   │
└──────────────┘
```

### Event Flow: User Registration

```
1. Client → Auth Service: POST /register
   ↓
2. Auth Service:
   - Creates user in database
   - Generates JWT tokens
   - Publishes "user.created" event → SNS
   ↓
3. SNS distributes event to subscribers
   ↓
4. SQS receives event and queues it
   ↓
5. User Service (async):
   - Polls SQS queue
   - Receives "user.created" event
   - Creates user profile in user_db
   - Acknowledges message
   ↓
6. Response to Client (already sent):
   - Access token + refresh token
```

### Event Types

#### Published by Auth Service

**1. `user.created`**
```typescript
{
  userId: string;
  email: string;
  timestamp: string;
  source: 'auth-service';
}
```
**Consumers**: User Service (creates profile)

**2. `user.email.verification.requested`**
```typescript
{
  userId: string;
  email: string;
  verificationToken: string;
  expiresAt: string;
  timestamp: string;
  source: 'auth-service';
}
```
**Consumers**: Notification Service (sends email)

**3. `user.password.reset.requested`**
```typescript
{
  userId: string;
  email: string;
  resetToken: string;
  expiresAt: string;
  timestamp: string;
  source: 'auth-service';
}
```
**Consumers**: Notification Service (sends email)

**4. `user.deactivated`**
```typescript
{
  userId: string;
  email: string;
  timestamp: string;
  source: 'auth-service';
}
```
**Consumers**: All services (cleanup operations)

### Event Publisher Implementation

```typescript
// auth-service/src/infrastructure/events/SNSEventPublisher.ts
export class SNSEventPublisher implements IEventPublisher {
  async publish(topic: string, event: Record<string, unknown>): Promise<void> {
    const topicArn = `arn:aws:sns:${region}:${accountId}:${topic}`;
    
    await this.sns.publish({
      TopicArn: topicArn,
      Message: JSON.stringify(event),
      MessageAttributes: {
        eventType: { DataType: 'String', StringValue: topic },
        source: { DataType: 'String', StringValue: 'auth-service' },
      },
    }).promise();
  }
}
```

### Event Consumer Implementation

```typescript
// user-service/src/infrastructure/events/SQSEventConsumer.ts
export class SQSEventConsumer implements IEventConsumer {
  async start(): Promise<void> {
    // Poll SQS queue
    // Process messages
    // Acknowledge successful processing
  }
  
  subscribe(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
  }
}
```

---

## Communication Patterns

### Pattern 1: Request-Response (Synchronous)

**Use Case**: User Service needs to verify user role

```
User Service → Auth Service: GET /users/{userId}/roles
Auth Service → User Service: { roles: ['user', 'admin'] }
```

**Pros**:
- ✅ Immediate response
- ✅ Strong consistency
- ✅ Simple to implement

**Cons**:
- ⚠️ Service coupling
- ⚠️ Service must be available
- ⚠️ Latency adds up

### Pattern 2: Event-Driven (Asynchronous)

**Use Case**: User registration triggers profile creation

```
Auth Service → SNS: Publish "user.created"
SNS → SQS: Queue event
User Service ← SQS: Consume event (async)
User Service: Create profile
```

**Pros**:
- ✅ Loose coupling
- ✅ Services can be unavailable temporarily
- ✅ Scalable
- ✅ Eventual consistency

**Cons**:
- ⚠️ Eventual consistency (not immediate)
- ⚠️ More complex error handling
- ⚠️ Need to handle duplicate events

### Pattern 3: API Composition (Future)

**Use Case**: Get user with profile and addresses

```
Gateway → Auth Service: Get user
Gateway → User Service: Get profile
Gateway → User Service: Get addresses
Gateway: Compose response
```

**Note**: Currently not implemented (gateway-service is future)

---

## Event-Driven Architecture

### Benefits

1. **Decoupling**
   - Services don't need to know about each other
   - Can add new consumers without changing publisher

2. **Scalability**
   - Process events at own pace
   - Scale consumers independently

3. **Resilience**
   - If consumer is down, events queue up
   - No data loss
   - Automatic retry

4. **Flexibility**
   - Easy to add new event handlers
   - Multiple consumers for same event

### Event Processing Guarantees

**At-Least-Once Delivery**:
- SQS guarantees message delivery
- May receive duplicate events
- Implement idempotency in handlers

**Ordering**:
- Events may arrive out of order
- Design handlers to be order-independent
- Use timestamps for ordering if needed

### Error Handling

**Dead Letter Queue (DLQ)**:
- Failed events go to DLQ
- Manual inspection and retry
- Prevents event loss

**Retry Strategy**:
- Exponential backoff
- Max retry attempts
- Alert on persistent failures

---

## Local Development vs Production

### Local Development

**LocalStack** emulates AWS services:
- SNS → LocalStack SNS (port 4566)
- SQS → LocalStack SQS (port 4566)

**Auto-Detection**:
```typescript
if (LOCALSTACK_ENDPOINT) {
  // Use LocalStack
} else if (NODE_ENV === 'production') {
  // Use real AWS
} else {
  // Use Mock (for testing)
}
```

### Production

**Real AWS Services**:
- SNS → AWS SNS
- SQS → AWS SQS
- IAM roles for authentication
- CloudWatch for monitoring

**No Code Changes Needed**:
- Same code works in both environments
- Environment variables control behavior

---

## Service Discovery

### Current Implementation

**Static Configuration**:
- Services know each other via environment variables
- `AUTH_SERVICE_URL=http://auth-service:3001`

### Future: Service Discovery

**Options**:
1. **AWS ECS Service Discovery**
2. **Kubernetes DNS**
3. **API Gateway** (routes to services)
4. **Service Mesh** (Istio, Linkerd)

---

## Communication Flow Examples

### Example 1: User Registration

```
┌─────────┐
│ Client  │
└────┬────┘
     │ POST /register
     ▼
┌──────────────┐
│ Auth Service │────┐
└──────────────┘    │
     │              │ Publish "user.created"
     │              ▼
     │         ┌────────┐
     │         │  SNS   │
     │         └────┬───┘
     │              │
     │              ▼
     │         ┌────────┐
     │         │  SQS   │
     │         └────┬───┘
     │              │
     │              ▼
     │         ┌──────────────┐
     │         │User Service │ (async)
     │         └─────────────┘
     │
     │ Response: { accessToken, refreshToken }
     ▼
┌─────────┐
│ Client  │
└─────────┘
```

### Example 2: Get User Profile (with RBAC)

```
┌─────────┐
│ Client  │
└────┬────┘
     │ GET /users/:userId
     │ Authorization: Bearer <token>
     ▼
┌──────────────┐
│ User Service │
└────┬─────────┘
     │
     │ Decode JWT (local)
     │ Extract userId, roles
     │
     │ (Optional) Verify with Auth Service
     │ GET /auth/users/:userId/roles
     │
     │ Check RBAC permissions
     │
     │ Fetch profile from user_db
     │
     ▼
┌─────────┐
│ Client  │
└─────────┘
```

---

## Best Practices

### Synchronous Communication

1. **Use for**:
   - Critical validations
   - Operations requiring immediate confirmation
   - Small, fast operations

2. **Avoid for**:
   - Long-running operations
   - Non-critical operations
   - Operations that can be eventually consistent

### Asynchronous Communication

1. **Use for**:
   - Non-critical operations
   - Operations that can be eventually consistent
   - Decoupling services
   - High-volume operations

2. **Implement**:
   - Idempotency (handle duplicate events)
   - Error handling and retries
   - Dead letter queues
   - Event versioning

---

## Next Steps

- [Data Flow](./07-data-flow.md) - Understand data flow through the system
- [Security Architecture](./06-security.md) - Learn about security implementation

