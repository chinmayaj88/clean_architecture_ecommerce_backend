# Order Service Database Design

## Overview

**Database Name**: `order_db`  
**Service**: Order Service  
**Purpose**: Order management, order items, order history, shipping  
**Technology**: PostgreSQL 15+  
**ORM**: Prisma

---

## ER Diagram

```mermaid
erDiagram
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "has"
    ORDERS ||--o{ ORDER_NOTES : "has"
    ORDERS ||--|| ORDER_SHIPPING_ADDRESSES : "shipped_to"
    
    ORDERS {
        string id PK "cuid()"
        string orderNumber UK "Unique order number"
        string userId "References auth.users.id, indexed"
        string status "pending|confirmed|processing|shipped|delivered|cancelled|refunded, indexed"
        string paymentStatus "pending|paid|failed|refunded, indexed"
        decimal subtotal
        decimal taxAmount
        decimal shippingAmount
        decimal discountAmount
        decimal totalAmount "Indexed"
        string currency "Default: USD"
        string paymentMethodId "References payment.payments.id"
        string shippingMethod
        string trackingNumber "Nullable"
        datetime estimatedDeliveryDate
        datetime shippedAt "Nullable"
        datetime deliveredAt "Nullable"
        datetime cancelledAt "Nullable"
        json metadata "Additional data"
        datetime createdAt "Indexed"
        datetime updatedAt
    }
    
    ORDER_ITEMS {
        string id PK "cuid()"
        string orderId FK "References orders.id, indexed"
        string productId "References product.products.id"
        string variantId "References product.product_variants.id"
        string productName "Snapshot"
        string productSku "Snapshot"
        string productImageUrl "Snapshot"
        decimal unitPrice "Snapshot"
        int quantity
        decimal totalPrice
        datetime createdAt
    }
    
    ORDER_STATUS_HISTORY {
        string id PK "cuid()"
        string orderId FK "References orders.id, indexed"
        string status
        string previousStatus
        string changedBy "user_id or system"
        string reason "Nullable"
        datetime createdAt "Indexed"
    }
    
    ORDER_SHIPPING_ADDRESSES {
        string id PK "cuid()"
        string orderId FK UK "References orders.id"
        string firstName
        string lastName
        string company
        string addressLine1
        string addressLine2
        string city
        string state
        string postalCode
        string country
        string phone
        datetime createdAt
    }
    
    ORDER_NOTES {
        string id PK "cuid()"
        string orderId FK "References orders.id, indexed"
        text note
        string createdBy "user_id or system"
        boolean isInternal "Default: false"
        datetime createdAt "Indexed"
    }
```

---

## Table Specifications

### 1. `orders` Table

**Purpose**: Order headers and core order information

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique order identifier |
| `order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable order number (e.g., ORD-2024-001234) |
| `user_id` | VARCHAR(25) | NOT NULL, INDEXED | References auth-service `users.id` (no FK constraint) |
| `status` | VARCHAR(20) | DEFAULT 'pending', INDEXED | Order status (pending, confirmed, processing, shipped, delivered, cancelled, refunded) |
| `payment_status` | VARCHAR(20) | DEFAULT 'pending', INDEXED | Payment status (pending, paid, failed, refunded) |
| `subtotal` | DECIMAL(10,2) | NOT NULL | Subtotal before tax and shipping |
| `tax_amount` | DECIMAL(10,2) | DEFAULT 0 | Tax amount |
| `shipping_amount` | DECIMAL(10,2) | DEFAULT 0 | Shipping cost |
| `discount_amount` | DECIMAL(10,2) | DEFAULT 0 | Discount amount |
| `total_amount` | DECIMAL(10,2) | NOT NULL, INDEXED | Total order amount |
| `currency` | VARCHAR(3) | DEFAULT 'USD' | Currency code (ISO 4217) |
| `payment_method_id` | VARCHAR(25) | NULLABLE | References payment-service `payments.id` (no FK constraint) |
| `shipping_method` | VARCHAR(100) | NULLABLE | Shipping method name |
| `tracking_number` | VARCHAR(100) | NULLABLE | Shipping tracking number |
| `estimated_delivery_date` | TIMESTAMP | NULLABLE | Estimated delivery date |
| `shipped_at` | TIMESTAMP | NULLABLE | Shipment timestamp |
| `delivered_at` | TIMESTAMP | NULLABLE | Delivery timestamp |
| `cancelled_at` | TIMESTAMP | NULLABLE | Cancellation timestamp |
| `metadata` | JSONB | NULLABLE | Additional order data (promo codes, etc.) |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Order creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `order_number` (for order lookup)
- Index: `user_id` (for user order queries)
- Index: `status` (for status filtering)
- Index: `payment_status` (for payment status filtering)
- Index: `total_amount` (for order value queries)
- Index: `created_at` (for time-based queries)
- Composite Index: `(user_id, status, created_at)` (for user order history)
- Composite Index: `(status, created_at)` (for order processing)

**Cross-Service References**:
- `user_id` references `auth.users.id` (logical reference, no FK constraint)
- `payment_method_id` references `payment.payments.id` (logical reference, no FK constraint)

**Order Status Flow**:
```
pending → confirmed → processing → shipped → delivered
  ↓                                    ↓
cancelled                          refunded
```

**Production Considerations**:
- **Order Number Generation**: Use sequential or UUID-based format
- **Partitioning**: Partition by `created_at` month for large volumes
- **Archiving**: Archive completed orders older than 2 years

---

### 2. `order_items` Table

**Purpose**: Order line items (products in order)

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique item identifier |
| `order_id` | VARCHAR(25) | FOREIGN KEY → orders.id, INDEXED | Order identifier |
| `product_id` | VARCHAR(25) | NOT NULL | References product-service `products.id` (no FK constraint) |
| `variant_id` | VARCHAR(25) | NULLABLE | References product-service `product_variants.id` (no FK constraint) |
| `product_name` | VARCHAR(255) | NOT NULL | Product name snapshot |
| `product_sku` | VARCHAR(100) | NOT NULL | Product SKU snapshot |
| `product_image_url` | VARCHAR(500) | NULLABLE | Product image URL snapshot |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Price per unit at time of order |
| `quantity` | INTEGER | NOT NULL | Quantity ordered |
| `total_price` | DECIMAL(10,2) | NOT NULL | Total price (unit_price × quantity) |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `order_id` (for order item queries)
- Index: `product_id` (for product order history)

**Foreign Keys**:
- `order_id` → `orders.id` (CASCADE DELETE)

**Cross-Service References**:
- `product_id` references `product.products.id` (logical reference, no FK constraint)
- `variant_id` references `product.product_variants.id` (logical reference, no FK constraint)

**Snapshot Pattern**:
- Product data is **snapshot** at order time
- Prevents issues if product is updated/deleted
- Ensures order history accuracy

---

### 3. `order_status_history` Table

**Purpose**: Track order status changes for audit trail

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique history record identifier |
| `order_id` | VARCHAR(25) | FOREIGN KEY → orders.id, INDEXED | Order identifier |
| `status` | VARCHAR(20) | NOT NULL | New status |
| `previous_status` | VARCHAR(20) | NULLABLE | Previous status |
| `changed_by` | VARCHAR(25) | NOT NULL | User ID or 'system' |
| `reason` | TEXT | NULLABLE | Status change reason |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Status change timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `order_id` (for order history queries)
- Index: `created_at` (for time-based queries)
- Composite Index: `(order_id, created_at)` (for ordered history)

**Foreign Keys**:
- `order_id` → `orders.id` (CASCADE DELETE)

**Purpose**:
- **Audit Trail**: Track all status changes
- **Debugging**: Understand order flow
- **Compliance**: Required for order tracking

---

### 4. `order_shipping_addresses` Table

**Purpose**: Shipping address snapshot (snapshot at order time)

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique address identifier |
| `order_id` | VARCHAR(25) | FOREIGN KEY → orders.id, UNIQUE | Order identifier (one address per order) |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `company` | VARCHAR(255) | NULLABLE | Company name |
| `address_line1` | VARCHAR(255) | NOT NULL | Street address line 1 |
| `address_line2` | VARCHAR(255) | NULLABLE | Street address line 2 |
| `city` | VARCHAR(100) | NOT NULL | City |
| `state` | VARCHAR(100) | NULLABLE | State/Province |
| `postal_code` | VARCHAR(20) | NOT NULL | Postal/ZIP code |
| `country` | VARCHAR(2) | NOT NULL | Country code (ISO 3166-1 alpha-2) |
| `phone` | VARCHAR(20) | NULLABLE | Phone number |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Constraint: `order_id` (one address per order)

**Foreign Keys**:
- `order_id` → `orders.id` (CASCADE DELETE)

**Snapshot Pattern**:
- Address is **snapshot** at order time
- Prevents issues if user updates/deletes address
- Ensures shipping accuracy

---

### 5. `order_notes` Table

**Purpose**: Order notes (internal and customer-facing)

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique note identifier |
| `order_id` | VARCHAR(25) | FOREIGN KEY → orders.id, INDEXED | Order identifier |
| `note` | TEXT | NOT NULL | Note content |
| `created_by` | VARCHAR(25) | NOT NULL | User ID or 'system' |
| `is_internal` | BOOLEAN | DEFAULT false | Internal note flag (not visible to customer) |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `order_id` (for order note queries)
- Index: `created_at` (for time-based queries)

**Foreign Keys**:
- `order_id` → `orders.id` (CASCADE DELETE)

**Use Cases**:
- Customer notes (special instructions)
- Internal notes (fulfillment notes, issues)
- System notes (status changes, etc.)

---

## Indexing Strategy

### Primary Indexes
- All primary keys (automatic)

### Performance Indexes
- `orders.order_number` - Unique index for order lookup
- `orders.user_id` - User order queries
- `orders.status` - Status filtering
- `orders.payment_status` - Payment status filtering
- `orders.total_amount` - Order value queries
- `orders.created_at` - Time-based queries
- `order_items.order_id` - Order item queries
- `order_status_history.order_id` - Order history queries

### Composite Indexes
- `orders(user_id, status, created_at)` - User order history
- `orders(status, created_at)` - Order processing queue
- `order_status_history(order_id, created_at)` - Ordered history

---

## Production Optimizations

### 1. Order Number Generation

**Sequential Format**:
```typescript
// Format: ORD-YYYY-MMDD-NNNNNN
const orderNumber = `ORD-${year}-${month}${day}-${sequentialNumber}`;
```

**UUID-Based Format**:
```typescript
// Format: ORD-{short-uuid}
const orderNumber = `ORD-${shortUuid()}`;
```

### 2. Order Processing Queue

**Status-Based Queries**:
```sql
-- Get pending orders
SELECT * FROM orders 
WHERE status = 'pending' 
ORDER BY created_at ASC 
LIMIT 100;

-- Get orders ready to ship
SELECT * FROM orders 
WHERE status = 'confirmed' 
AND payment_status = 'paid'
ORDER BY created_at ASC;
```

### 3. Order Archiving

**Archive Strategy**:
- Archive orders older than 2 years
- Move to separate archive table
- Keep summary data in main table
- Full data available in archive

### 4. Backup Strategy

**Automated Backups**:
- Daily full backups at 2 AM UTC
- Hourly incremental backups
- Point-in-time recovery (PITR) enabled
- Cross-region backup replication

**Retention**:
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

### 5. Monitoring

**Key Metrics**:
- Order creation rate
- Order status distribution
- Average order value
- Order processing time
- Failed orders

**Alerts**:
- Order creation rate spike
- High pending order count
- Failed payment rate > 5%
- Order processing time > 24 hours

---

## Event Processing

### Published Events

**Order Created**:
```typescript
{
  eventType: 'order.created',
  orderId: 'cm123...',
  userId: 'cm456...',
  totalAmount: 99.99,
  currency: 'USD',
  // ...
}
```

**Order Status Changed**:
```typescript
{
  eventType: 'order.status.changed',
  orderId: 'cm123...',
  previousStatus: 'pending',
  newStatus: 'confirmed',
  // ...
}
```

### Consumed Events

**From Payment Service**:
- `payment.succeeded` - Update order payment status
- `payment.failed` - Update order payment status
- `payment.refunded` - Update order status to refunded

**From Product Service**:
- `product.updated` - Update order item snapshots (if needed)
- `product.deleted` - Handle deleted products in orders

---

## Security Considerations

### 1. Data Protection

- **PII**: Orders contain user addresses and payment info
- **Access Control**: Users can only access their own orders
- **Admin Access**: Admins can access all orders via RBAC

### 2. Order Integrity

- **Snapshot Pattern**: Order items and addresses are snapshots
- **Immutable**: Orders cannot be modified after confirmation
- **Cancellation**: Only pending orders can be cancelled

---

## Estimated Capacity

### Current Scale (Production)

- **Orders**: 10,000,000
- **Order Items**: 30,000,000 (average 3 per order)
- **Order Status History**: 50,000,000
- **Order Shipping Addresses**: 10,000,000
- **Order Notes**: 5,000,000

### Growth Projections

- **New Orders**: 100,000/month
- **New Order Items**: 300,000/month
- **New Status History**: 500,000/month

### Storage Estimates

- **Database Size**: ~200 GB
- **Monthly Growth**: ~20 GB
- **Index Size**: ~40 GB

---

## Next Steps

- View [Payment Service Database](./05-payment-service-database.md)
- View [Cross-Service References](./08-cross-service-references.md)
- Return to [Database Architecture Overview](./README.md)

