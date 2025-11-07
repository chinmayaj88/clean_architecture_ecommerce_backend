# Security Architecture

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Account Security](#account-security)
5. [API Security](#api-security)
6. [Data Security](#data-security)
7. [Audit & Monitoring](#audit--monitoring)

---

## Overview

Security is implemented at multiple layers to protect the platform from various threats. The architecture follows defense-in-depth principles.

---

## Authentication

### JWT-Based Authentication

**Technology**: JSON Web Tokens (JWT)  
**Library**: `jsonwebtoken`

### Token Types

#### 1. Access Token

**Purpose**: Authenticate API requests  
**Lifetime**: 15 minutes (configurable)  
**Storage**: Client-side (memory or secure storage)

**Payload**:
```typescript
{
  userId: string;
  email: string;
  roles: string[];
  iat: number;  // Issued at
  exp: number;  // Expires at
}
```

**Usage**:
```
Authorization: Bearer <access_token>
```

#### 2. Refresh Token

**Purpose**: Obtain new access tokens  
**Lifetime**: 7 days (configurable)  
**Storage**: 
- Database (for revocation)
- HTTP-only cookie (recommended)
- Client storage (alternative)

**Security**:
- ✅ Stored in database for revocation
- ✅ Can be revoked on logout
- ✅ Rotated on each refresh

### Authentication Flow

```
1. User → Auth Service: POST /login
   { email, password }
   ↓
2. Auth Service:
   - Validates credentials
   - Checks account lockout
   - Generates access token (15m)
   - Generates refresh token (7d)
   - Stores refresh token in database
   ↓
3. Response:
   {
     accessToken: "...",
     refreshToken: "...",
     expiresIn: "15m"
   }
   ↓
4. Client stores tokens
   ↓
5. Client includes access token in requests:
   Authorization: Bearer <access_token>
```

### Token Refresh Flow

```
1. Client → Auth Service: POST /refresh
   { refreshToken: "..." }
   ↓
2. Auth Service:
   - Validates refresh token
   - Checks if token is revoked
   - Generates new access token
   - Optionally rotates refresh token
   ↓
3. Response:
   {
     accessToken: "...",
     refreshToken: "..." (new),
     expiresIn: "15m"
   }
```

### Password Security

**Hashing**: bcrypt  
**Library**: `bcryptjs`  
**Rounds**: 10 (default, configurable)

**Implementation**:
```typescript
// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

**Characteristics**:
- ✅ One-way hashing (cannot be reversed)
- ✅ Salted automatically
- ✅ Computationally expensive (prevents brute force)
- ✅ Industry standard

---

## Authorization

### Role-Based Access Control (RBAC)

**Implementation**: JWT token includes roles

### Roles

- **user** - Default role for all users
- **admin** - Administrative privileges

### Role Assignment

```typescript
// On user registration
await userRoleRepository.create({
  userId: user.id,
  roleId: defaultRole.id,  // 'user' role
});
```

### Authorization Checks

#### In Auth Service

```typescript
// middleware/auth.middleware.ts
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return sendForbidden(res, 'Insufficient permissions');
    }
    next();
  };
}
```

#### In User Service

```typescript
// middleware/auth.middleware.ts
export function requireOwnershipOrRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    const authenticatedUserId = req.user?.userId;
    
    // Allow if own resource OR has required role
    if (userId === authenticatedUserId || hasRole(req.user, roles)) {
      return next();
    }
    
    return sendForbidden(res, 'Access denied');
  };
}
```

### Permission Model

**Ownership-Based**:
- Users can access their own resources
- Example: `GET /users/{userId}` - User can access their own profile

**Role-Based**:
- Admins can access any resource
- Example: Admin can access any user's profile

**Combined**:
- `requireOwnershipOrRole('admin')` - Own resource OR admin role

---

## Account Security

### Account Lockout

**Purpose**: Prevent brute force attacks

**Configuration**:
```bash
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30
```

**Implementation**:
1. Track failed login attempts in database
2. Increment counter on failed login
3. Lock account after max attempts
4. Unlock after lockout duration expires
5. Reset counter on successful login

**Database Fields**:
```sql
users (
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL
)
```

**Flow**:
```
Failed Login → Increment failed_login_attempts
    ↓
If attempts >= MAX_LOGIN_ATTEMPTS:
    → Set locked_until = NOW() + LOCKOUT_DURATION
    → Log security event
    ↓
User tries to login:
    → Check if locked_until > NOW()
    → If locked: Reject with lockout message
    → If unlocked: Allow login attempt
```

### Security Audit Logging

**Purpose**: Track security-sensitive operations

**Logged Events**:
- `login_success` - Successful login
- `login_failed` - Failed login attempt
- `login_blocked` - Login blocked (locked/deactivated)
- `account_locked` - Account locked due to failed attempts
- `password_changed` - Password changed
- `account_deactivated` - Account deactivated

**Data Captured**:
```typescript
{
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata: {
    failedAttempts?: number;
    lockedUntil?: string;
    reason?: string;
  };
  createdAt: Date;
}
```

**Use Cases**:
- Security incident investigation
- Compliance auditing
- Anomaly detection
- User behavior analysis

---

## API Security

### CORS (Cross-Origin Resource Sharing)

**Production Configuration**:
```bash
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

**Implementation**:
```typescript
if (NODE_ENV === 'production') {
  corsOptions.origin = (origin, callback) => {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  };
}
```

**Security**:
- ✅ Whitelist approach (only allowed origins)
- ✅ Logs blocked requests
- ✅ Prevents unauthorized cross-origin access

### Rate Limiting

**Purpose**: Prevent abuse and DoS attacks

**Implementation**: Redis-backed distributed rate limiting

**Configuration**:
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

**Auth Endpoints** (Stricter):
- Login: 5 requests per 15 minutes
- Register: 5 requests per 15 minutes

**General Endpoints**:
- 100 requests per 15 minutes

**Features**:
- ✅ Distributed (works across multiple instances)
- ✅ Redis-backed (persistent across restarts)
- ✅ Falls back to in-memory if Redis unavailable
- ✅ Returns `429 Too Many Requests` when exceeded

### Request Validation

**Library**: `express-validator`

**Validations**:
- Email format validation
- Password strength requirements
- Input sanitization
- Type checking

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Security Headers

**Library**: `helmet`

**Headers Set**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)
- `Content-Security-Policy`

---

## Data Security

### Password Storage

**Never Store Plaintext**:
- ✅ Always hash passwords
- ✅ Use bcrypt with salt
- ✅ One-way hashing (cannot be reversed)

### Sensitive Data

**Encryption at Rest**:
- Database encryption (managed by cloud provider)
- Backup encryption

**Encryption in Transit**:
- HTTPS/TLS for all API communication
- Database connections use SSL

### Payment Methods

**Tokenization** (Future):
- Store payment tokens, not card numbers
- Use PCI-compliant payment processor
- Never store full card details

---

## Audit & Monitoring

### Security Audit Logs

**Storage**: Database table `security_audit_logs`

**Retention**: Configurable (recommended: 1 year)

**Query Examples**:
```sql
-- Failed login attempts in last 24 hours
SELECT * FROM security_audit_logs
WHERE action = 'login_failed'
AND createdAt > NOW() - INTERVAL '24 hours';

-- Account lockouts
SELECT * FROM security_audit_logs
WHERE action = 'account_locked';
```

### Logging

**Structured Logging**: Winston  
**Format**: JSON

**Logged Information**:
- Request ID (for tracing)
- IP address
- User agent
- Timestamp
- Error details (in development)

**Security Events**:
- All authentication attempts
- Authorization failures
- Account lockouts
- Password changes

---

## Security Best Practices

### Implemented

✅ JWT with short-lived access tokens  
✅ Refresh token rotation  
✅ Account lockout after failed attempts  
✅ Password hashing with bcrypt  
✅ CORS protection  
✅ Rate limiting  
✅ Security audit logging  
✅ Input validation  
✅ Security headers (Helmet)  
✅ Request ID tracking  

### Recommended for Production

- [ ] Implement API key authentication for service-to-service
- [ ] Add IP whitelisting for admin endpoints
- [ ] Implement CSRF protection
- [ ] Add request signing for critical operations
- [ ] Implement certificate pinning
- [ ] Add WAF (Web Application Firewall)
- [ ] Set up security monitoring and alerts
- [ ] Regular security audits
- [ ] Penetration testing

---

## Security Checklist

### Authentication
- [x] JWT-based authentication
- [x] Refresh token mechanism
- [x] Token expiration
- [x] Token revocation
- [x] Password hashing (bcrypt)

### Authorization
- [x] Role-Based Access Control (RBAC)
- [x] Ownership-based access control
- [x] Permission checks on all endpoints

### Account Security
- [x] Account lockout mechanism
- [x] Security audit logging
- [x] Failed attempt tracking

### API Security
- [x] CORS protection
- [x] Rate limiting
- [x] Input validation
- [x] Security headers
- [x] Request timeout

### Data Security
- [x] Password hashing
- [x] HTTPS/TLS (production)
- [x] Database encryption (cloud-managed)

---

## Next Steps

- [Data Flow](./07-data-flow.md) - Understand how data flows through the system
- [Technology Stack](./08-technology-stack.md) - Complete technology overview

