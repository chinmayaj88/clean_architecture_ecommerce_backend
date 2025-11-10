# Payment Service

Payment processing service for the e-commerce platform.

## Overview

The Payment Service handles payment processing, transactions, refunds, and payment methods. It integrates with payment providers (Stripe, PayPal, or Mock for development) and publishes payment events for other services.

## Features

- ✅ **Payment Processing**: Create and process payments
- ✅ **Payment Methods**: Store and manage payment methods
- ✅ **Refunds**: Process full and partial refunds
- ✅ **Webhooks**: Process payment provider webhooks
- ✅ **Event Publishing**: Publish payment events (payment.succeeded, payment.failed, payment.refunded)
- ✅ **Event Consumption**: Consume order events (order.created, order.cancelled)
- ✅ **Transaction History**: Complete transaction audit trail
- ✅ **Idempotency**: Prevent duplicate payment processing
- ✅ **Circuit Breaker**: Protection against external service failures
- ✅ **Retry Logic**: Exponential backoff for transient failures
- ✅ **Pagination & Filtering**: Advanced payment querying
- ✅ **Input Validation**: Comprehensive request validation

## API Endpoints

### Payments

- `POST /api/v1/payments` - Create a payment
- `POST /api/v1/payments/:paymentId/process` - Process a payment
- `POST /api/v1/payments/:paymentId/refund` - Refund a payment
- `GET /api/v1/payments/:paymentId` - Get payment details (with transactions and refunds)
- `GET /api/v1/orders/:orderId/payment` - Get payment by order ID
- `GET /api/v1/payments` - Get user payments (with pagination and filtering)

### Payment Methods

- `POST /api/v1/payment-methods` - Create a payment method
- `GET /api/v1/payment-methods` - Get user payment methods

### Webhooks

- `POST /api/v1/webhooks` - Process payment provider webhooks

### API Documentation

- `GET /api-docs` - Swagger UI interactive API documentation

## API Documentation

The Payment Service includes comprehensive OpenAPI 3.0 specification:

- **Interactive Documentation**: Visit `http://localhost:3006/api-docs` for Swagger UI
- **OpenAPI Spec**: See `openapi.yaml` for the complete API specification
- **Features**:
  - All endpoints documented
  - Request/response schemas
  - Authentication requirements
  - Example requests/responses
  - Error responses
  - Query parameters and pagination

## Database Schema

- `payments` - Payment records
- `payment_transactions` - Transaction history
- `refunds` - Refund records
- `payment_methods` - Stored payment methods
- `payment_webhooks` - Webhook logs

## Environment Variables

See `.env.example` for required environment variables.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

4. Run migrations:
   ```bash
   npm run prisma:migrate -- --name init
   ```

5. Start the service:
   ```bash
   npm run dev
   ```

## Development

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Build
npm run build

# Start
npm start

# Development mode
npm run dev
```

## Production

The service is production-ready with:
- ✅ Database transactions
- ✅ Event publishing (SNS)
- ✅ Event consumption (SQS)
- ✅ Circuit breaker
- ✅ Retry logic
- ✅ Input validation
- ✅ Error handling
- ✅ Health checks
- ✅ Logging

## Integration

### Order Service

- Consumes `order.created` events → Creates and processes payment
- Consumes `order.cancelled` events → Cancels pending payments
- Updates order payment status via HTTP API

### Event Publishing

- `payment.succeeded` - Payment completed successfully
- `payment.failed` - Payment failed
- `payment.refunded` - Refund processed

## Testing

```bash
npm test
```

## License

MIT

