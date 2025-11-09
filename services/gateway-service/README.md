# Gateway Service

API Gateway for routing requests to microservices. Provides a single entry point for all client requests with authentication, rate limiting, and request routing.

## Features

### Core Features
- **Request Routing**: Proxies requests to appropriate microservices (auth, user, product)
- **Authentication**: Validates JWT tokens for protected routes
- **Rate Limiting**: Global and endpoint-specific rate limiting
- **Request Logging**: Centralized logging for all API requests
- **Error Handling**: Graceful error handling and service unavailability handling
- **Health Checks**: Health and readiness endpoints

### Enterprise Features
- **Circuit Breaker**: Prevents cascading failures with automatic recovery
- **Service Health Monitoring**: Continuous health checks for all backend services
- **Metrics Collection**: Comprehensive request and performance metrics
- **Response Caching**: In-memory caching with automatic invalidation
- **Request Validation**: Validates incoming requests before processing
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Distributed Tracing**: Request ID tracking across services
- **API Documentation**: Interactive Swagger UI documentation
- **Comprehensive Error Handling**: Graceful error recovery and user-friendly messages

## Setup

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0

### Environment Variables

Create a `.env` file in the `services/gateway-service` directory:

```env
# Server
NODE_ENV=development
PORT=3000

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
PRODUCT_SERVICE_URL=http://localhost:3003

# JWT Secret (must match auth-service JWT_SECRET)
JWT_SECRET=your-32-character-minimum-secret-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5

# Redis (optional, for distributed rate limiting)
REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info

# Timeouts
REQUEST_TIMEOUT_MS=30000
SHUTDOWN_TIMEOUT_MS=30000
PROXY_TIMEOUT_MS=25000

# Request Size
MAX_REQUEST_SIZE_MB=10
```

### Installation

```bash
cd services/gateway-service
npm install
```

### Build

```bash
npm run build
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

## API Routes

### Gateway Endpoints

- `GET /health` - Health check with service status
- `GET /ready` - Readiness check
- `GET /health/services` - Detailed service health information
- `GET /metrics` - Comprehensive metrics dashboard
- `GET /api-docs` - Interactive API documentation (Swagger UI)

### Proxied Routes

All routes are proxied to the appropriate microservice:

- `/api/v1/auth/*` → Auth Service (port 3001)
- `/api/v1/security/*` → Auth Service (port 3001)
- `/api/v1/users/*` → User Service (port 3002)
- `/api/v1/products/*` → Product Service (port 3003)

### Authentication

#### Public Routes (no auth required)

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `GET /api/v1/products/*` (most product routes)

#### Protected Routes (auth required)

- All `/api/v1/users/*` routes
- All `/api/v1/security/*` routes
- `/api/v1/auth/*` routes (except public ones listed above)
- Product admin routes (e.g., `/api/v1/products/*/moderate`)

### Rate Limiting

- **Global**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP (login, register, forgot-password, reset-password)

## Usage Example

### Register a new user (public route)

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Login (public route)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get user profile (protected route)

```bash
curl -X GET http://localhost:3000/api/v1/users/user-id \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get products (public route)

```bash
curl -X GET http://localhost:3000/api/v1/products
```

## Architecture

The gateway service:

1. Receives client requests
2. Validates requests (size, content-type, etc.)
3. Checks circuit breaker state
4. Validates JWT tokens for protected routes
5. Applies rate limiting
6. Checks response cache (for GET requests)
7. Routes requests to appropriate microservices
8. Monitors service health
9. Tracks metrics
10. Forwards user information (from JWT) to backend services
11. Caches responses (for cacheable routes)
12. Returns responses to clients

## Request Flow

```
Client → Gateway → Auth Middleware → Rate Limiter → Proxy → Backend Service
                                                              ↓
Client ← Gateway ← Response Transformation ←─────────────────┘
```

## Error Handling

The gateway handles:

- Service unavailability (503 Service Unavailable)
- Circuit breaker open (503 Service Unavailable)
- Invalid JWT tokens (401 Unauthorized)
- Rate limit exceeded (429 Too Many Requests)
- Request timeouts (408 Request Timeout)
- Request too large (413 Payload Too Large)
- Invalid routes (404 Not Found)
- Server errors (500 Internal Server Error)

All errors include:
- Request ID for tracing
- User-friendly error messages
- Detailed logging for debugging

## Development

### Project Structure

```
gateway-service/
├── src/
│   ├── config/
│   │   └── env.ts                 # Environment configuration
│   ├── infrastructure/
│   │   ├── circuit-breaker/
│   │   │   ├── CircuitBreaker.ts       # Circuit breaker implementation
│   │   │   └── CircuitBreakerManager.ts # Circuit breaker manager
│   │   ├── health/
│   │   │   └── ServiceHealthChecker.ts # Service health monitoring
│   │   ├── metrics/
│   │   │   └── MetricsCollector.ts     # Metrics collection
│   │   ├── cache/
│   │   │   └── ResponseCache.ts        # Response caching
│   │   └── logging/
│   │       └── logger.ts               # Winston logger
│   ├── middleware/
│   │   ├── auth.middleware.ts          # JWT authentication
│   │   ├── errorHandler.middleware.ts  # Error handling
│   │   ├── rateLimiter.middleware.ts   # Rate limiting
│   │   ├── requestId.middleware.ts     # Request ID tracking
│   │   ├── metrics.middleware.ts       # Metrics collection
│   │   ├── requestValidator.middleware.ts # Request validation
│   │   └── retry.middleware.ts         # Retry logic
│   ├── routes/
│   │   └── proxy.routes.ts             # Proxy routes configuration
│   ├── __tests__/
│   │   ├── circuit-breaker.test.ts     # Circuit breaker tests
│   │   ├── metrics.test.ts             # Metrics tests
│   │   ├── cache.test.ts               # Cache tests
│   │   ├── health-checker.test.ts      # Health checker tests
│   │   └── integration/
│   │       └── gateway.test.ts         # Integration tests
│   └── index.ts                        # Main entry point
├── package.json
├── tsconfig.json
├── jest.config.js
├── openapi.yaml
├── README.md
└── ENTERPRISE_FEATURES.md
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Production Deployment

### Requirements
- Node.js >= 22.0.0
- Multiple instances behind a load balancer (for high availability)
- Monitoring and alerting setup
- Centralized logging

### Environment Variables
See `.env.example` for all required environment variables.

### Monitoring
- Health checks: `/health` and `/ready`
- Metrics: `/metrics`
- Service health: `/health/services`

### Scaling
The gateway is stateless and can be horizontally scaled. Consider:
- Using Redis for distributed caching
- Using Redis for distributed rate limiting
- Load balancing across multiple instances

## Notes

- The gateway validates JWT tokens but doesn't issue them (auth-service handles that)
- The `JWT_SECRET` must match the `JWT_SECRET` in auth-service for token validation to work
- Rate limiting is applied before routing to prevent abuse
- Request IDs are forwarded to backend services for distributed tracing
- Circuit breakers automatically recover when services come back online
- Response caching reduces load on backend services
- Health checks run every 30 seconds by default
- Metrics are kept in memory (consider exporting to Prometheus for production)

For more details on enterprise features, see [ENTERPRISE_FEATURES.md](./ENTERPRISE_FEATURES.md).

