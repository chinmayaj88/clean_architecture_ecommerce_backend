# Cross-Service References

## Overview

In a microservices architecture, services reference each other's data using **ID strings** rather than database foreign keys. This document details all cross-service references in the e-commerce platform.

---

## Key Principles

### ❌ NO Foreign Keys Across Services

**Why?**
- Each service has its own database
- Foreign keys cannot span databases
- Services must be independently deployable
- Services must work independently

### ✅ ID References Instead

**How?**
- Store IDs as strings (VARCHAR)
- No database-level constraints
- Validate via HTTP API calls (when needed)
- Synchronize via events

---

## Reference Map

### From User Service

| Field | Table | References | Service | Type | Validation |
|-------|-------|------------|---------|------|------------|
| `user_id` | `user_profiles` | `users.id` | Auth Service | ID String | Event sync |
| `product_id` | `wishlist_items` | `products.id` | Product Service | ID String | HTTP API (optional) |

### From Cart Service

| Field | Table | References | Service | Type | Validation |
|-------|-------|------------|---------|------|------------|
| `user_id` | `carts` | `users.id` | Auth Service | ID String | JWT token |
| `product_id` | `cart_items` | `products.id` | Product Service | ID String | HTTP API |
| `variant_id` | `cart_items` | `product_variants.id` | Product Service | ID String | HTTP API |

**Example**:
```sql
-- user-service database
CREATE TABLE user_profiles (
  id VARCHAR(25) PRIMARY KEY,
  user_id VARCHAR(25) UNIQUE, -- References auth.users.id (no FK!)
  email VARCHAR(255) UNIQUE,
  -- ...
);
```

**Synchronization**:
- Auth-service creates user → Publishes `user.created` event
- User-service consumes event → Creates profile with same `user_id`

---

### From Order Service

| Field | Table | References | Service | Type | Validation |
|-------|-------|------------|---------|------|------------|
| `user_id` | `orders` | `users.id` | Auth Service | ID String | JWT token |
| `product_id` | `order_items` | `products.id` | Product Service | ID String | HTTP API |
| `variant_id` | `order_items` | `product_variants.id` | Product Service | ID String | HTTP API |
| `payment_method_id` | `orders` | `payments.id` | Payment Service | ID String | Event sync |
| `cart_id` | `orders` | `carts.id` | Cart Service | ID String | HTTP API (optional) |
| `coupon_code` | `orders` | `coupons.code` | Discount Service | ID String | HTTP API |

**Example**:
```sql
-- order-service database
CREATE TABLE orders (
  id VARCHAR(25) PRIMARY KEY,
  user_id VARCHAR(25) NOT NULL, -- References auth.users.id (no FK!)
  payment_method_id VARCHAR(25), -- References payment.payments.id (no FK!)
  -- ...
);

CREATE TABLE order_items (
  id VARCHAR(25) PRIMARY KEY,
  order_id VARCHAR(25) REFERENCES orders(id), -- FK within same DB ✅
  product_id VARCHAR(25) NOT NULL, -- References product.products.id (no FK!)
  variant_id VARCHAR(25), -- References product.product_variants.id (no FK!)
  -- ...
);
```

**Validation**:
- `user_id`: Validated via JWT token (from auth-service)
- `product_id`: Validated via HTTP API call to product-service
- `payment_method_id`: Validated via event from payment-service

---

### From Payment Service

| Field | Table | References | Service | Type | Validation |
|-------|-------|------------|---------|------|------------|
| `order_id` | `payments` | `orders.id` | Order Service | ID String | HTTP API |
| `user_id` | `payments` | `users.id` | Auth Service | ID String | JWT token |
| `order_id` | `refunds` | `orders.id` | Order Service | ID String | HTTP API |

**Example**:
```sql
-- payment-service database
CREATE TABLE payments (
  id VARCHAR(25) PRIMARY KEY,
  order_id VARCHAR(25) NOT NULL, -- References order.orders.id (no FK!)
  user_id VARCHAR(25) NOT NULL, -- References auth.users.id (no FK!)
  -- ...
);
```

**Validation**:
- `order_id`: Validated via HTTP API call to order-service
- `user_id`: Validated via JWT token (from auth-service)

---

### From Product Service

| Field | Table | References | Service | Type | Validation |
|-------|-------|------------|---------|------|------------|
| `user_id` | `product_reviews` | `users.id` | Auth Service | ID String | JWT token |

**Example**:
```sql
-- product-service database
CREATE TABLE product_reviews (
  id VARCHAR(25) PRIMARY KEY,
  product_id VARCHAR(25) REFERENCES products(id), -- FK within same DB ✅
  user_id VARCHAR(25) NOT NULL, -- References auth.users.id (no FK!)
  -- ...
);
```

**Validation**:
- `user_id`: Validated via JWT token (from auth-service)

---

### From Notification Service

| Field | Table | References | Service | Type | Validation |
|-------|-------|------------|---------|------|------------|
| `user_id` | `notifications` | `users.id` | Auth Service | ID String | Event sync |
| `user_id` | `notification_preferences` | `users.id` | Auth Service | ID String | Event sync |

---

**Note**: Analytics, Recommendation, and Search services are maintained in a separate repository (`analytics-platform`). Their cross-service references are documented in that repository.

### From Return Service

| Field | Table | References | Service | Type | Validation |
|-------|-------|------------|---------|------|------------|
| `order_id` | `return_requests` | `orders.id` | Order Service | ID String | HTTP API |
| `user_id` | `return_requests` | `users.id` | Auth Service | ID String | JWT token |
| `order_item_id` | `return_items` | `order_items.id` | Order Service | ID String | HTTP API |
| `product_id` | `return_items` | `products.id` | Product Service | ID String | HTTP API |
| `payment_id` | `refunds` | `payments.id` | Payment Service | ID String | HTTP API |
| `order_id` | `refunds` | `orders.id` | Order Service | ID String | HTTP API |
| `user_id` | `refunds` | `users.id` | Auth Service | ID String | JWT token |

**Example**:
```sql
-- notification-service database
CREATE TABLE notifications (
  id VARCHAR(25) PRIMARY KEY,
  user_id VARCHAR(25) NOT NULL, -- References auth.users.id (no FK!)
  -- ...
);
```

**Validation**:
- `user_id`: Validated via event from auth-service or HTTP API call

---

## Reference Patterns

### Pattern 1: Event-Driven Synchronization

**Use Case**: User registration

```
1. Auth-service creates user (id: "cm123")
   ↓
2. Publishes event: { userId: "cm123", email: "user@example.com" }
   ↓
3. User-service consumes event
   ↓
4. Creates profile with userId: "cm123"
   ↓
5. Same ID, but no FK constraint
```

**Benefits**:
- ✅ Decoupled services
- ✅ Eventually consistent
- ✅ Fault tolerant

---

### Pattern 2: HTTP API Validation

**Use Case**: Order creation

```
1. Order-service receives order request
   ↓
2. Validates product exists:
   GET /api/v1/products/{productId}
   ↓
3. Product-service responds: { id: "cm456", name: "Product", ... }
   ↓
4. Order-service creates order_item with productId: "cm456"
   ↓
5. No FK constraint, validated via API
```

**Benefits**:
- ✅ Strong consistency (immediate validation)
- ✅ Real-time validation
- ⚠️ Creates coupling (service must be available)

---

### Pattern 3: JWT Token Validation

**Use Case**: User authentication

```
1. User-service receives request with JWT token
   ↓
2. Decodes JWT token (contains userId: "cm123")
   ↓
3. Validates token signature (no HTTP call needed)
   ↓
4. Uses userId from token
   ↓
5. No FK constraint, validated via JWT
```

**Benefits**:
- ✅ No HTTP call needed (fast)
- ✅ Stateless authentication
- ✅ Scalable

---

## Data Consistency

### Eventual Consistency

**When to Use**:
- Non-critical operations
- Data synchronization
- Decoupled operations

**Examples**:
- User profile creation (from auth-service event)
- Product updates (from product-service event)
- Order status updates (from order-service event)

**Consistency Guarantee**: Seconds to minutes

---

### Strong Consistency

**When to Use**:
- Critical operations
- Real-time validation
- Immediate feedback required

**Examples**:
- Order creation (validate product exists)
- Payment processing (validate order exists)
- Inventory check (validate stock available)

**Consistency Guarantee**: Immediate

---

## Denormalization Strategy

### Why Denormalize?

**Performance**: Avoid cross-service queries  
**Availability**: Work offline if other service is down  
**Speed**: Faster reads

### Examples

**1. Email in User Profile**:
```sql
-- user-service database
user_profiles.email VARCHAR(255) -- Denormalized from auth.users.email
```

**Synchronization**: Via `user.created` event

**2. Product Data in Order Items**:
```sql
-- order-service database
order_items.product_name VARCHAR(255) -- Snapshot from product.products.name
order_items.product_sku VARCHAR(100) -- Snapshot from product.products.sku
order_items.unit_price DECIMAL(10,2) -- Snapshot from product.products.price
```

**Synchronization**: Snapshot at order time (immutable)

**3. Product Data in Wishlist**:
```sql
-- user-service database
wishlist_items.product_name VARCHAR(255) -- Denormalized from product.products.name
wishlist_items.product_image_url VARCHAR(500) -- Denormalized from product.products.image_url
```

**Synchronization**: Via `product.updated` event

---

## Reference Validation Strategies

### Strategy 1: Trust Events (Recommended)

**When**: Event-driven synchronization

**Example**:
```typescript
// User-service receives user.created event
async function handleUserCreatedEvent(event: UserCreatedEvent) {
  // Trust the event - auth-service already validated user exists
  await userProfileRepository.create({
    userId: event.userId, // No validation needed
    email: event.email,
  });
}
```

**Benefits**:
- ✅ Fast (no HTTP call)
- ✅ Decoupled
- ✅ Scalable

---

### Strategy 2: HTTP API Validation

**When**: Critical operations requiring immediate validation

**Example**:
```typescript
// Order-service creates order
async function createOrder(orderData: CreateOrderData) {
  // Validate product exists
  const product = await productServiceClient.getProduct(orderData.productId);
  if (!product) {
    throw new Error('Product not found');
  }
  
  // Create order
  await orderRepository.create({
    productId: orderData.productId,
    // ...
  });
}
```

**Benefits**:
- ✅ Strong consistency
- ✅ Real-time validation
- ⚠️ Creates coupling

---

### Strategy 3: JWT Token Validation

**When**: User authentication

**Example**:
```typescript
// User-service validates request
async function authenticate(req: Request) {
  const token = req.headers.authorization;
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // Use userId from token (no HTTP call needed)
  req.user = { userId: decoded.userId };
}
```

**Benefits**:
- ✅ Fast (no HTTP call)
- ✅ Stateless
- ✅ Scalable

---

## Best Practices

### ✅ DO

1. **Use ID strings** for cross-service references
2. **Synchronize via events** for non-critical operations
3. **Validate via HTTP API** for critical operations
4. **Denormalize** frequently accessed data
5. **Snapshot** data at transaction time (orders, etc.)

### ❌ DON'T

1. **Don't use foreign keys** across services
2. **Don't make synchronous calls** for non-critical operations
3. **Don't duplicate** data without sync strategy
4. **Don't assume** data consistency (use eventual consistency)
5. **Don't query** other services' databases directly

---

## Reference Summary Table

| From Service | To Service | Reference Count | Primary Use Case |
|--------------|------------|-----------------|------------------|
| User Service | Auth Service | 1 | User profile sync |
| User Service | Product Service | 1 | Wishlist items |
| Cart Service | Auth Service | 1 | Cart ownership |
| Cart Service | Product Service | 2 | Cart items |
| Order Service | Auth Service | 1 | Order ownership |
| Order Service | Product Service | 2 | Order items |
| Order Service | Cart Service | 1 | Cart conversion |
| Order Service | Discount Service | 1 | Coupon codes |
| Order Service | Payment Service | 1 | Payment method |
| Payment Service | Order Service | 2 | Payment/refund links |
| Payment Service | Auth Service | 1 | Payment ownership |
| Shipping Service | Order Service | 1 | Shipment tracking |
| Return Service | Order Service | 3 | Return requests |
| Return Service | Auth Service | 2 | Return ownership |
| Return Service | Product Service | 2 | Return items |
| Return Service | Payment Service | 1 | Refund processing |

**Total Cross-Service References**: 20

**Note**: Analytics, Recommendation, and Search services maintain their own cross-service references in the separate `analytics-platform` repository.

---

## Troubleshooting

### Issue: Stale Data

**Problem**: Denormalized data is out of sync

**Solution**:
- Implement event-driven updates
- Use version numbers for conflict resolution
- Implement reconciliation jobs

### Issue: Missing References

**Problem**: Referenced entity doesn't exist

**Solution**:
- Validate via HTTP API before creating reference
- Handle gracefully (log error, don't fail)
- Implement retry logic for events

### Issue: Circular Dependencies

**Problem**: Services depend on each other

**Solution**:
- Use events for decoupling
- Implement saga pattern for distributed transactions
- Use eventual consistency

---

## Next Steps

- View [Master ER Diagram](./00-master-er-diagram.md) for visual representation
- View individual service database designs:
  - [Auth Service Database](./01-auth-service-database.md)
  - [User Service Database](./02-user-service-database.md)
  - [Product Service Database](./03-product-service-database.md)
  - [Order Service Database](./04-order-service-database.md)
  - [Payment Service Database](./05-payment-service-database.md)
  - [Notification Service Database](./06-notification-service-database.md)
- Return to [Database Architecture Overview](./README.md)

