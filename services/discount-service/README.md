# Discount/Promotion Service

A microservice for managing coupons, promotional campaigns, discount rules, and usage tracking in the e-commerce platform.

## Overview

The Discount/Promotion Service handles:
- **Coupon Management**: Create, update, and manage coupon codes with various discount types
- **Promotion Management**: Create and manage promotional campaigns with complex rules
- **Discount Calculation**: Validate and calculate discounts for orders
- **Usage Tracking**: Track coupon and promotion usage for analytics

## Features

- Coupon validation (expiration, usage limits, minimum amount, per-user limits)
- Discount calculation (percentage, fixed amount, free shipping)
- Promotion rule evaluation (buy X get Y, volume discounts, bundles)
- Usage tracking for coupons and promotions
- Integration with Cart, Order, and Product services
- Event-driven architecture (order.created, order.cancelled)

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Architecture**: Clean Architecture with Dependency Injection
- **Event System**: AWS SNS/SQS (with LocalStack for development)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Start the service:
```bash
npm run dev
```

The service will start on port 3008 by default.

## API Endpoints

### Coupon Management

- `POST /api/v1/coupons` - Create coupon
- `GET /api/v1/coupons` - List coupons (with filters)
- `GET /api/v1/coupons/:id` - Get coupon by ID
- `GET /api/v1/coupons/code/:code` - Get coupon by code
- `PUT /api/v1/coupons/:id` - Update coupon
- `DELETE /api/v1/coupons/:id` - Delete coupon
- `POST /api/v1/coupons/:id/activate` - Activate coupon
- `POST /api/v1/coupons/:id/deactivate` - Deactivate coupon

### Promotion Management

- `POST /api/v1/promotions` - Create promotion
- `GET /api/v1/promotions` - List promotions
- `GET /api/v1/promotions/:id` - Get promotion by ID
- `PUT /api/v1/promotions/:id` - Update promotion
- `DELETE /api/v1/promotions/:id` - Delete promotion
- `POST /api/v1/promotions/:id/rules` - Add promotion rule
- `PUT /api/v1/promotions/:id/rules/:ruleId` - Update promotion rule
- `DELETE /api/v1/promotions/:id/rules/:ruleId` - Delete promotion rule

### Discount Operations

- `POST /api/v1/discounts/validate` - Validate coupon code
- `POST /api/v1/discounts/calculate` - Calculate discount amount
- `POST /api/v1/discounts/apply` - Apply coupon to cart
- `POST /api/v1/discounts/evaluate-promotions` - Evaluate applicable promotions for cart

## Database Schema

The service uses the following main tables:

- `coupons` - Coupon code definitions
- `coupon_usage` - Coupon usage tracking
- `promotions` - Promotional campaign definitions
- `promotion_rules` - Promotion rule conditions and actions
- `promotion_usage` - Promotion usage tracking

See `prisma/schema.prisma` for the complete schema.

## Integration

### Cart Service
- Apply discount to cart via HTTP API
- Update cart totals with discount amount
- Store coupon code in cart

### Order Service
- Consume `order.created` event - Track coupon/promotion usage
- Consume `order.cancelled` event - Reverse coupon/promotion usage

### Product Service
- Validate product/category eligibility for coupons/promotions
- Get product details for promotion rule evaluation

## Event Handlers

### From Order Service

- `order.created` - Track coupon and promotion usage when an order is created
- `order.cancelled` - Reverse coupon and promotion usage when an order is cancelled

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Service port (default: 3008)
- `CART_SERVICE_URL` - Cart service URL
- `ORDER_SERVICE_URL` - Order service URL
- `PRODUCT_SERVICE_URL` - Product service URL
- `SQS_QUEUE_URL` - SQS queue URL for event consumption

## Development

### Running Tests

```bash
npm test
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy
```

### Prisma Studio

```bash
npx prisma studio
```

## Architecture

The service follows Clean Architecture principles:

- **Core Layer**: Entities and use cases
- **Application Layer**: Controllers and DTOs
- **Infrastructure Layer**: Database, external services, event handlers
- **Ports**: Interfaces for external dependencies

## License

MIT

