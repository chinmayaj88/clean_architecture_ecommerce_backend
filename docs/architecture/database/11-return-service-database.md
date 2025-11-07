# Return/Refund Service Database Design

## Overview

**Database Name**: `return_db`  
**Service**: Return/Refund Service  
**Purpose**: Return requests, return authorization (RMA), return tracking, refund coordination  
**Technology**: PostgreSQL 15+  
**ORM**: Prisma

---

## ER Diagram

```mermaid
erDiagram
    RETURN_REQUESTS ||--o{ RETURN_ITEMS : "contains"
    RETURN_REQUESTS ||--o{ RETURN_STATUS_HISTORY : "has"
    RETURN_REQUESTS ||--|| RETURN_AUTHORIZATIONS : "has"
    RETURN_AUTHORIZATIONS ||--o{ RETURN_TRACKING : "has"
    RETURN_REQUESTS ||--o{ REFUNDS : "triggers"
    
    RETURN_REQUESTS {
        string id PK "cuid()"
        string orderId "References order.orders.id, indexed"
        string userId "References auth.users.id, indexed"
        string rmaNumber UK "Return authorization number"
        string status "pending|approved|rejected|in_transit|received|processed|closed, indexed"
        string returnReason "defective|wrong_item|not_as_described|changed_mind|other"
        text returnNotes "Nullable"
        string refundMethod "original_payment|store_credit|exchange"
        decimal refundAmount "Calculated refund amount"
        string currency "Default: USD"
        datetime requestedAt "Indexed"
        datetime approvedAt "Nullable"
        datetime rejectedAt "Nullable"
        datetime receivedAt "Nullable"
        datetime processedAt "Nullable"
        datetime closedAt "Nullable"
        json metadata "Additional data"
        datetime createdAt "Indexed"
        datetime updatedAt
    }
    
    RETURN_ITEMS {
        string id PK "cuid()"
        string returnRequestId FK "References return_requests.id, indexed"
        string orderItemId "References order.order_items.id"
        string productId "References product.products.id"
        string variantId "References product.product_variants.id"
        string productName "Snapshot"
        string productSku "Snapshot"
        int quantity "Return quantity"
        decimal unitPrice "Snapshot"
        decimal refundAmount "Refund amount for this item"
        string returnReason "Item-specific reason"
        string condition "new|used|damaged|defective"
        datetime createdAt
        datetime updatedAt
    }
    
    RETURN_AUTHORIZATIONS {
        string id PK "cuid()"
        string returnRequestId FK UK "References return_requests.id"
        string rmaNumber UK "RMA number"
        string returnAddress "JSON return address"
        string returnInstructions "Nullable"
        string trackingNumber "Nullable, return tracking"
        datetime expiresAt "RMA expiration"
        datetime createdAt
        datetime updatedAt
    }
    
    RETURN_STATUS_HISTORY {
        string id PK "cuid()"
        string returnRequestId FK "References return_requests.id, indexed"
        string status "Status value"
        string previousStatus "Nullable"
        string changedBy "user_id or system"
        text notes "Nullable"
        datetime createdAt "Indexed"
    }
    
    RETURN_TRACKING {
        string id PK "cuid()"
        string authorizationId FK "References return_authorizations.id, indexed"
        string status "tracking status"
        string location "Nullable"
        text description "Status description"
        datetime timestamp "Status timestamp, indexed"
        json carrierData "Carrier-specific data"
        datetime createdAt
    }
    
    REFUNDS {
        string id PK "cuid()"
        string returnRequestId FK "References return_requests.id, indexed"
        string paymentId "References payment.payments.id"
        string orderId "References order.orders.id"
        string userId "References auth.users.id"
        string refundMethod "original_payment|store_credit"
        decimal amount "Refund amount"
        string currency "Default: USD"
        string status "pending|processing|completed|failed, indexed"
        string reason "Refund reason"
        datetime processedAt "Nullable"
        datetime createdAt "Indexed"
        datetime updatedAt
    }
```

---

## Table Specifications

### 1. `return_requests` Table

**Purpose**: Return request headers

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique return request identifier |
| `order_id` | VARCHAR(25) | NOT NULL, INDEXED | References order-service `orders.id` (no FK constraint) |
| `user_id` | VARCHAR(25) | NOT NULL, INDEXED | References auth-service `users.id` (no FK constraint) |
| `rma_number` | VARCHAR(50) | UNIQUE, NOT NULL | Return Merchandise Authorization number |
| `status` | VARCHAR(50) | DEFAULT 'pending', INDEXED | Return status |
| `return_reason` | VARCHAR(50) | NOT NULL | Return reason |
| `return_notes` | TEXT | NULLABLE | Return notes/comments |
| `refund_method` | VARCHAR(50) | NOT NULL | Refund method (original_payment, store_credit, exchange) |
| `refund_amount` | DECIMAL(10,2) | DEFAULT 0 | Calculated refund amount |
| `currency` | VARCHAR(3) | DEFAULT 'USD' | Currency code (ISO 4217) |
| `requested_at` | TIMESTAMP | DEFAULT now(), INDEXED | Request timestamp |
| `approved_at` | TIMESTAMP | NULLABLE | Approval timestamp |
| `rejected_at` | TIMESTAMP | NULLABLE | Rejection timestamp |
| `received_at` | TIMESTAMP | NULLABLE | Received timestamp |
| `processed_at` | TIMESTAMP | NULLABLE | Processing completion timestamp |
| `closed_at` | TIMESTAMP | NULLABLE | Closure timestamp |
| `metadata` | JSONB | NULLABLE | Additional return data |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `rma_number` (for RMA lookup)
- Index: `order_id` (for order return queries)
- Index: `user_id` (for user return queries)
- Index: `status` (for status filtering)
- Index: `requested_at` (for time-based queries)
- Composite Index: `(user_id, status)` (for user return queries)

**Cross-Service References**:
- `order_id` references `order.orders.id` (logical reference, no FK constraint)
- `user_id` references `auth.users.id` (logical reference, no FK constraint)

**Return Status Flow**:
```
pending → approved → in_transit → received → processed → closed
  ↓
rejected
```

**Return Reasons**:
- `defective` - Product is defective
- `wrong_item` - Wrong item received
- `not_as_described` - Item not as described
- `changed_mind` - Changed mind
- `other` - Other reason

**Refund Methods**:
- `original_payment` - Refund to original payment method
- `store_credit` - Refund as store credit
- `exchange` - Exchange for different item

**Production Considerations**:
- **RMA Generation**: Generate unique RMA numbers
- **Time Limits**: Enforce return time limits (e.g., 30 days)
- **Approval Process**: Manual or automatic approval based on rules

---

### 2. `return_items` Table

**Purpose**: Return line items (items being returned)

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique item identifier |
| `return_request_id` | VARCHAR(25) | FOREIGN KEY → return_requests.id, INDEXED | Return request identifier |
| `order_item_id` | VARCHAR(25) | NOT NULL | References order-service `order_items.id` (no FK constraint) |
| `product_id` | VARCHAR(25) | NOT NULL | References product-service `products.id` (no FK constraint) |
| `variant_id` | VARCHAR(25) | NULLABLE | References product-service `product_variants.id` (no FK constraint) |
| `product_name` | VARCHAR(255) | NOT NULL | Product name snapshot |
| `product_sku` | VARCHAR(100) | NOT NULL | Product SKU snapshot |
| `quantity` | INTEGER | NOT NULL | Return quantity |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Unit price snapshot |
| `refund_amount` | DECIMAL(10,2) | NOT NULL | Refund amount for this item |
| `return_reason` | VARCHAR(50) | NULLABLE | Item-specific return reason |
| `condition` | VARCHAR(20) | NOT NULL | Item condition (new, used, damaged, defective) |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `return_request_id` (for return item queries)
- Index: `product_id` (for product return queries)

**Foreign Keys**:
- `return_request_id` → `return_requests.id` (CASCADE DELETE)

**Cross-Service References**:
- `order_item_id` references `order.order_items.id` (logical reference, no FK constraint)
- `product_id` references `product.products.id` (logical reference, no FK constraint)
- `variant_id` references `product.product_variants.id` (logical reference, no FK constraint)

**Item Conditions**:
- `new` - Item is new/unused
- `used` - Item has been used
- `damaged` - Item is damaged
- `defective` - Item is defective

---

### 3. `return_authorizations` Table

**Purpose**: Return authorization (RMA) details

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique authorization identifier |
| `return_request_id` | VARCHAR(25) | FOREIGN KEY → return_requests.id, UNIQUE | Return request identifier |
| `rma_number` | VARCHAR(50) | UNIQUE, NOT NULL | RMA number |
| `return_address` | JSONB | NOT NULL | Return shipping address (JSON) |
| `return_instructions` | TEXT | NULLABLE | Return instructions |
| `tracking_number` | VARCHAR(100) | NULLABLE | Return tracking number |
| `expires_at` | TIMESTAMP | NULLABLE | RMA expiration timestamp |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Constraint: `return_request_id` (one authorization per return)
- Unique Index: `rma_number` (for RMA lookup)

**Foreign Keys**:
- `return_request_id` → `return_requests.id` (CASCADE DELETE)

**Purpose**:
- **Authorization**: Authorize return request
- **Instructions**: Provide return instructions
- **Tracking**: Track return shipment

---

### 4. `return_status_history` Table

**Purpose**: Return status change history

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique history record identifier |
| `return_request_id` | VARCHAR(25) | FOREIGN KEY → return_requests.id, INDEXED | Return request identifier |
| `status` | VARCHAR(50) | NOT NULL | New status |
| `previous_status` | VARCHAR(50) | NULLABLE | Previous status |
| `changed_by` | VARCHAR(25) | NOT NULL | User ID or 'system' |
| `notes` | TEXT | NULLABLE | Status change notes |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Status change timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `return_request_id` (for return history queries)
- Index: `created_at` (for time-based queries)
- Composite Index: `(return_request_id, created_at)` (for ordered history)

**Foreign Keys**:
- `return_request_id` → `return_requests.id` (CASCADE DELETE)

**Purpose**:
- **Audit Trail**: Track all status changes
- **Debugging**: Understand return flow
- **Compliance**: Required for return tracking

---

### 5. `return_tracking` Table

**Purpose**: Return shipment tracking history

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique tracking record identifier |
| `authorization_id` | VARCHAR(25) | FOREIGN KEY → return_authorizations.id, INDEXED | Authorization identifier |
| `status` | VARCHAR(50) | NOT NULL | Tracking status |
| `location` | VARCHAR(255) | NULLABLE | Current location |
| `description` | TEXT | NULLABLE | Status description |
| `timestamp` | TIMESTAMP | NOT NULL, INDEXED | Status timestamp |
| `carrier_data` | JSONB | NULLABLE | Carrier-specific tracking data |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `authorization_id` (for authorization tracking queries)
- Index: `timestamp` (for time-based queries)
- Composite Index: `(authorization_id, timestamp)` (for ordered tracking history)

**Foreign Keys**:
- `authorization_id` → `return_authorizations.id` (CASCADE DELETE)

---

### 6. `refunds` Table

**Purpose**: Refund records (coordination with payment service)

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique refund identifier |
| `return_request_id` | VARCHAR(25) | FOREIGN KEY → return_requests.id, INDEXED | Return request identifier |
| `payment_id` | VARCHAR(25) | NULLABLE | References payment-service `payments.id` (no FK constraint) |
| `order_id` | VARCHAR(25) | NOT NULL | References order-service `orders.id` (no FK constraint) |
| `user_id` | VARCHAR(25) | NOT NULL | References auth-service `users.id` (no FK constraint) |
| `refund_method` | VARCHAR(50) | NOT NULL | Refund method (original_payment, store_credit) |
| `amount` | DECIMAL(10,2) | NOT NULL | Refund amount |
| `currency` | VARCHAR(3) | DEFAULT 'USD' | Currency code |
| `status` | VARCHAR(20) | DEFAULT 'pending', INDEXED | Refund status (pending, processing, completed, failed) |
| `reason` | VARCHAR(255) | NULLABLE | Refund reason |
| `processed_at` | TIMESTAMP | NULLABLE | Processing completion timestamp |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `return_request_id` (for return refund queries)
- Index: `status` (for status filtering)
- Index: `created_at` (for time-based queries)

**Foreign Keys**:
- `return_request_id` → `return_requests.id` (CASCADE DELETE)

**Cross-Service References**:
- `payment_id` references `payment.payments.id` (logical reference, no FK constraint)
- `order_id` references `order.orders.id` (logical reference, no FK constraint)
- `user_id` references `auth.users.id` (logical reference, no FK constraint)

**Refund Status Flow**:
```
pending → processing → completed
  ↓
failed
```

**Note**: This table coordinates with payment-service refunds. Payment-service handles actual refund processing.

---

## Indexing Strategy

### Primary Indexes
- All primary keys (automatic)

### Performance Indexes
- `return_requests.rma_number` - Unique index for RMA lookup
- `return_requests.order_id` - Order return queries
- `return_requests.user_id` - User return queries
- `return_requests.status` - Status filtering
- `return_items.return_request_id` - Return item queries
- `return_status_history.return_request_id` - Return history queries
- `refunds.return_request_id` - Return refund queries
- `refunds.status` - Refund status filtering

### Composite Indexes
- `return_requests(user_id, status)` - User return queries
- `return_status_history(return_request_id, created_at)` - Ordered history
- `return_tracking(authorization_id, timestamp)` - Ordered tracking history

---

## Production Optimizations

### 1. Return Request Processing

**Create Return Request**:
```typescript
async function createReturnRequest(
  orderId: string,
  userId: string,
  items: ReturnItem[]
): Promise<ReturnRequest> {
  // Validate return eligibility
  const order = await orderServiceClient.getOrder(orderId);
  if (!isReturnEligible(order)) {
    throw new Error('Order is not eligible for return');
  }
  
  // Calculate refund amount
  const refundAmount = calculateRefundAmount(items);
  
  // Generate RMA number
  const rmaNumber = generateRMANumber();
  
  // Create return request
  const returnRequest = await returnRequestRepository.create({
    orderId,
    userId,
    rmaNumber,
    status: 'pending',
    refundAmount,
    // ...
  });
  
  // Create return items
  for (const item of items) {
    await returnItemRepository.create({
      returnRequestId: returnRequest.id,
      orderItemId: item.orderItemId,
      productId: item.productId,
      quantity: item.quantity,
      refundAmount: item.refundAmount,
      // ...
    });
  }
  
  return returnRequest;
}
```

### 2. Return Approval

**Approve Return Request**:
```typescript
async function approveReturnRequest(returnRequestId: string) {
  const returnRequest = await returnRequestRepository.findById(returnRequestId);
  
  // Create return authorization
  const authorization = await returnAuthorizationRepository.create({
    returnRequestId: returnRequest.id,
    rmaNumber: returnRequest.rmaNumber,
    returnAddress: getReturnAddress(),
    returnInstructions: getReturnInstructions(),
    expiresAt: addDays(new Date(), 30), // 30 days to return
  });
  
  // Update return request status
  await returnRequestRepository.update(returnRequestId, {
    status: 'approved',
    approvedAt: new Date(),
  });
  
  // Add status history
  await returnStatusHistoryRepository.create({
    returnRequestId,
    status: 'approved',
    previousStatus: 'pending',
    changedBy: 'system',
  });
  
  // Publish event
  await eventPublisher.publish('return.approved', {
    returnRequestId,
    rmaNumber: authorization.rmaNumber,
    // ...
  });
}
```

### 3. Refund Processing

**Process Refund**:
```typescript
async function processRefund(returnRequestId: string) {
  const returnRequest = await returnRequestRepository.findById(returnRequestId);
  
  if (returnRequest.status !== 'received') {
    throw new Error('Return must be received before refund');
  }
  
  // Create refund record
  const refund = await refundRepository.create({
    returnRequestId,
    orderId: returnRequest.orderId,
    userId: returnRequest.userId,
    refundMethod: returnRequest.refundMethod,
    amount: returnRequest.refundAmount,
    status: 'pending',
  });
  
  // Process refund via payment service
  if (returnRequest.refundMethod === 'original_payment') {
    await paymentServiceClient.processRefund({
      paymentId: returnRequest.paymentId,
      amount: returnRequest.refundAmount,
      reason: 'Return',
    });
  }
  
  // Update refund status
  await refundRepository.update(refund.id, {
    status: 'processing',
  });
  
  // Update return request
  await returnRequestRepository.update(returnRequestId, {
    status: 'processed',
    processedAt: new Date(),
  });
}
```

### 4. Caching Strategy

**Redis Caching**:
- Return requests by `user_id` (TTL: 15 minutes)
- Return requests by `order_id` (TTL: 15 minutes)
- Return authorizations by `rma_number` (TTL: 1 hour)

**Cache Invalidation**:
- Invalidate on return status update
- Invalidate on refund processing

### 5. Backup Strategy

**Automated Backups**:
- Daily full backups at 2 AM UTC
- Hourly incremental backups
- Point-in-time recovery (PITR) enabled
- Cross-region backup replication

**Retention**:
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

### 6. Monitoring

**Key Metrics**:
- Return request rate
- Return approval rate
- Return processing time
- Refund processing time
- Return reasons distribution

**Alerts**:
- High return rate (> 10%)
- Return processing delays
- Refund processing failures
- RMA expiration approaching

---

## Security Considerations

### 1. Data Protection

- **PII**: Returns contain user and order data
- **Access Control**: Users can only access their own returns
- **Admin Access**: Admins can access all returns via RBAC

### 2. Return Security

- **RMA Validation**: Validate RMA numbers
- **Fraud Prevention**: Monitor for return abuse
- **Time Limits**: Enforce return time limits

---

## Event Processing

### Published Events

**Return Requested**:
```typescript
{
  eventType: 'return.requested',
  returnRequestId: 'cm123...',
  orderId: 'cm456...',
  userId: 'cm789...',
  rmaNumber: 'RMA-2024-001234',
  // ...
}
```

**Return Approved**:
```typescript
{
  eventType: 'return.approved',
  returnRequestId: 'cm123...',
  rmaNumber: 'RMA-2024-001234',
  // ...
}
```

**Return Received**:
```typescript
{
  eventType: 'return.received',
  returnRequestId: 'cm123...',
  // ...
}
```

### Consumed Events

**From Order Service**:
- `order.delivered` - Enable return requests
- `order.cancelled` - Cancel return requests

**From Payment Service**:
- `refund.completed` - Update return status
- `refund.failed` - Handle refund failure

---

## Estimated Capacity

### Current Scale (Production)

- **Return Requests**: 1,000,000
- **Return Items**: 2,000,000
- **Return Authorizations**: 1,000,000
- **Refunds**: 800,000

### Growth Projections

- **New Return Requests**: 10,000/month
- **New Refunds**: 8,000/month

### Storage Estimates

- **Database Size**: ~50 GB
- **Monthly Growth**: ~5 GB
- **Index Size**: ~10 GB

---

## Next Steps

- View [Cross-Service References](./08-cross-service-references.md)
- Return to [Database Architecture Overview](./README.md)

