# Order Service

Order management service for the e-commerce microservices platform.

## Overview

The Order Service handles order creation, management, and tracking. It integrates with:
- **Cart Service**: Converts carts to orders
- **Product Service**: Validates products and reserves inventory
- **User Service**: Retrieves shipping addresses

## Features

- ✅ Order creation from cart
- ✅ Order status management (pending → confirmed → processing → shipped → delivered)
- ✅ Payment status tracking
- ✅ Order history and audit trail
- ✅ Shipping address management
- ✅ Order notes (internal and customer-facing)
- ✅ Order number generation
- ✅ Inventory reservation

## API Endpoints

### Orders

- `POST /api/v1/orders` - Create order from cart
- `GET /api/v1/orders` - Get user's orders
- `GET /api/v1/orders/:orderId` - Get order by ID
- `GET /api/v1/orders/number/:orderNumber` - Get order by order number
- `PATCH /api/v1/orders/:orderId/status` - Update order status
- `PATCH /api/v1/orders/:orderId/payment-status` - Update payment status

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Or deploy migrations (production)
npm run prisma:migrate:deploy
```

### 4. Start Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Database Schema

The Order Service uses the following tables:

- `orders` - Order headers
- `order_items` - Order line items (product snapshots)
- `order_status_history` - Order status change history
- `order_shipping_addresses` - Shipping address snapshots
- `order_notes` - Order notes (internal and customer-facing)

## Order Status Flow

```
pending → confirmed → processing → shipped → delivered
  ↓                                    ↓
cancelled                          refunded
```

## Integration

### Cart Service

- Retrieves cart items when creating order
- Marks cart as converted after order creation

### Product Service

- Validates product availability
- Reserves inventory when order is created
- Gets product details for order item snapshots

### User Service

- Retrieves shipping addresses
- Gets default shipping address if not specified

## Environment Variables

See `.env.example` for all available environment variables.

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Open Prisma Studio
npm run prisma:studio
```

## Health Checks

- `GET /health` - Health check endpoint
- `GET /ready` - Readiness check endpoint

## API Documentation

OpenAPI documentation is available at `/api-docs` when the service is running.

