# Return/Refund Service

Return/Refund service for managing return requests, RMAs (Return Merchandise Authorization), return tracking, and refund coordination.

## Features

- **Return Request Management**: Create, view, and manage return requests
- **RMA Generation**: Automatic generation of unique RMA numbers
- **Return Authorization**: Approve/reject return requests with return instructions
- **Return Tracking**: Track return shipments with status history
- **Refund Coordination**: Coordinate refunds with payment service
- **Status History**: Complete audit trail of return status changes
- **Event-Driven**: Consumes events from order and payment services

## API Endpoints

### Return Requests

- `POST /api/v1/returns` - Create a new return request
- `GET /api/v1/returns/:id` - Get return request by ID
- `GET /api/v1/returns/user/:userId` - Get return requests by user
- `POST /api/v1/returns/:id/approve` - Approve return request (admin only)
- `PUT /api/v1/returns/:id/status` - Update return status (admin only)
- `POST /api/v1/returns/:id/refund` - Process refund (admin only)

## Database Schema

The service uses 6 main tables:

- `return_requests` - Return request headers
- `return_items` - Items being returned
- `return_authorizations` - RMA details and return instructions
- `return_status_history` - Status change audit trail
- `return_tracking` - Return shipment tracking
- `refunds` - Refund records (coordination with payment service)

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
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

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Start the service:
```bash
npm run dev
```

## Environment Variables

See `.env.example` for all required environment variables.

## Service Integration

### Consumed Events

- `order.delivered` - Enables return requests for delivered orders
- `order.cancelled` - Cancels pending return requests
- `refund.completed` - Updates return status after refund completion
- `refund.failed` - Handles refund failures

### Service Clients

- **Order Service**: Fetches order details for return eligibility validation
- **Payment Service**: Processes refunds via payment service

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

## Production Considerations

- **RMA Generation**: Unique RMA numbers generated with format `RMA-YYYY-XXXXXX`
- **Time Limits**: Return time limits should be enforced (e.g., 30 days)
- **Approval Process**: Can be manual or automatic based on business rules
- **Refund Processing**: Coordinates with payment service for actual refund processing

