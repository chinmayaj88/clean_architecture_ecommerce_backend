# Cart Service

Shopping cart management service for the e-commerce platform. Handles cart creation, item management, and cart operations for both authenticated users and guest users.

## Features

- **Cart Management**: Create, get, update, and delete carts
- **Item Management**: Add, update, remove items from cart
- **Guest Carts**: Support for anonymous users with session-based carts
- **Cart Merging**: Merge guest cart with user cart on login
- **Cart Calculation**: Automatic calculation of subtotal, tax, shipping, and total
- **Cart Expiration**: Automatic expiration of inactive carts
- **Product Integration**: Validates products and variants with product service
- **Caching**: Redis caching for improved performance

## Setup

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0
- PostgreSQL 16+
- Redis (optional, for caching)

### Environment Variables

Create a `.env` file in the `services/cart-service` directory:

```env
# Server
NODE_ENV=development
PORT=3004

# Database
DATABASE_URL=postgresql://user:password@localhost:5434/cart_db

# JWT (for token verification)
JWT_SECRET=your-32-character-minimum-secret-key-here

# Product Service
PRODUCT_SERVICE_URL=http://localhost:3003

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Cart Configuration
CART_EXPIRATION_DAYS=30
MAX_CART_ITEMS=100
MAX_ITEM_QUANTITY=99

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Request Configuration
REQUEST_TIMEOUT_MS=30000
SHUTDOWN_TIMEOUT_MS=30000
MAX_REQUEST_SIZE_MB=10

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

### Installation

```bash
cd services/cart-service
npm install
```

### Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Or use Makefile
make migrate-cart
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

## API Endpoints

### Cart Operations

- `POST /api/v1/carts` - Create cart
- `GET /api/v1/carts/:cartId` - Get cart by ID
- `GET /api/v1/carts` - Get cart (by userId or sessionId)
- `DELETE /api/v1/carts/:cartId` - Clear cart

### Cart Item Operations

- `POST /api/v1/carts/:cartId/items` - Add item to cart
- `PUT /api/v1/carts/:cartId/items/:itemId` - Update cart item
- `DELETE /api/v1/carts/:cartId/items/:itemId` - Remove item from cart

### Cart Merging

- `POST /api/v1/carts/merge` - Merge guest cart with user cart (requires authentication)

### Health Checks

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /api-docs` - API documentation

## Usage Examples

### Create Cart (Guest)

```bash
curl -X POST http://localhost:3004/api/v1/carts \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: session-123-abc" \
  -d '{
    "currency": "USD"
  }'
```

### Create Cart (Authenticated User)

```bash
curl -X POST http://localhost:3004/api/v1/carts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currency": "USD"
  }'
```

### Add Item to Cart

```bash
curl -X POST http://localhost:3004/api/v1/carts/{cartId}/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "productId": "cm123abc",
    "variantId": "cm456def",
    "quantity": 2
  }'
```

### Get Cart

```bash
curl -X GET http://localhost:3004/api/v1/carts/{cartId} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Merge Carts

```bash
curl -X POST http://localhost:3004/api/v1/carts/merge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "guestSessionId": "session-123-abc"
  }'
```

## Architecture

The service follows Clean Architecture principles:

- **Core**: Business logic (entities, use cases)
- **Application**: Controllers and request handling
- **Infrastructure**: Database, caching, external services
- **Ports**: Interfaces for dependency inversion

## Database Schema

- `carts` - Cart headers
- `cart_items` - Cart line items

See `prisma/schema.prisma` for the complete schema.

## Integration

### Product Service

The cart service integrates with the product service to:
- Validate product existence
- Get product details (name, price, SKU, image)
- Validate product availability
- Get product variant information

### Gateway Service

The gateway service routes cart requests to this service. Update the gateway service configuration to include:

```env
CART_SERVICE_URL=http://localhost:3004
```

## Cart Expiration

Carts expire after 30 days of inactivity (configurable via `CART_EXPIRATION_DAYS`). Expired carts are marked as `abandoned` and can be cleaned up.

## Cart Merging

When a user logs in, their guest cart (identified by sessionId) can be merged with their user cart. This allows users to keep their cart items when they sign in.

## Notes

- Cart items store product snapshots (name, price, SKU) at the time of adding to prevent issues if products are updated or deleted
- Maximum cart items: 100 (configurable)
- Maximum item quantity: 99 (configurable)
- Cart totals are automatically recalculated when items are added, updated, or removed
- Tax and shipping calculations are simplified (can be enhanced with tax/shipping services)

