# Database Architecture

## Table of Contents

1. [Overview](#overview)
2. [Database Per Service Pattern](#database-per-service-pattern)
3. [Service Databases](#service-databases)
4. [Cross-Service References](#cross-service-references)
5. [Production Design Patterns](#production-design-patterns)
6. [ER Diagrams](#er-diagrams)

---

## Repository Organization

**Important**: This repository contains database designs for **all services**, but services are split across repositories:

### Services in This Repository (`ecommerce-platform`)

- Auth Service
- User Service
- Product Service
- Order Service
- Payment Service
- Cart Service
- Discount Service
- Shipping Service
- Return Service
- Notification Service

**Total**: 10 core services

### Services in Separate Repository (`analytics-platform`)

- Analytics Service ⚠️
- Recommendation Service ⚠️
- Search Service ⚠️

**Note**: These services are implemented in a separate repository (`analytics-platform`) to keep this repository fast. Their database designs are maintained in that repository.

**See**: [Repository Organization](../REPOSITORY_ORGANIZATION.md) for details.

---

- ✅ **Service Independence**: Services can evolve their schemas independently
- ✅ **Data Isolation**: Each service owns and controls its data
- ✅ **Independent Scaling**: Databases can be scaled based on service needs
- ✅ **Technology Flexibility**: Services can use different database technologies if needed
- ✅ **Fault Isolation**: Database issues in one service don't affect others

### Architecture Principles

1. **No Shared Databases**: Each service has exclusive access to its database
2. **No Cross-Database Foreign Keys**: Services reference each other via IDs (strings), not database constraints
3. **Eventual Consistency**: Data consistency across services is maintained through events
4. **Denormalization**: Frequently accessed data is duplicated for performance
5. **Production-Ready**: All databases designed with scalability, performance, and reliability in mind

---

## Database Per Service Pattern

### Visual Representation

```
┌─────────────────────────────────────────────────────────────┐
│                    E-Commerce Platform                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Auth Service │      │ User Service │      │Product Service│
│  auth_db     │      │  user_db     │      │  product_db  │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│Order Service │      │Payment Service│      │Notification  │
│  order_db    │      │  payment_db  │      │ notification_db│
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Cart Service │      │Discount Service│      │Shipping Service│
│  cart_db     │      │  discount_db  │      │  shipping_db  │
└──────────────┘      └──────────────┘      └──────────────┘
                              │
                              ▼
                    ┌──────────────┐
                    │Return Service│
                    │  return_db  │
                    └──────────────┘
```

### Key Characteristics

- **10 Core Services** in this repository
- **3 Analytics Services** in separate repository (`analytics-platform`)
- **PostgreSQL**: All services use PostgreSQL for consistency
- **Separate Connections**: Each service connects only to its own database
- **No Cross-Database Queries**: Services communicate via APIs and events

---

## Service Databases

### 1. Auth Service Database (`auth_db`)

**Purpose**: Authentication, authorization, and security

**Key Tables**:
- `users` - User accounts and credentials
- `roles` - RBAC roles
- `user_roles` - User-role assignments
- `refresh_tokens` - JWT refresh tokens
- `password_reset_tokens` - Password reset tokens
- `email_verification_tokens` - Email verification tokens
- `security_audit_logs` - Security event logs
- `rate_limits` - Rate limiting (optional)

**Documentation**: [auth-service-database.md](./01-auth-service-database.md)

---

### 2. User Service Database (`user_db`)

**Purpose**: User profiles, addresses, payment methods, preferences

**Key Tables**:
- `user_profiles` - Extended user information
- `addresses` - Shipping and billing addresses
- `payment_methods` - Payment methods (tokenized)
- `user_preferences` - User settings
- `wishlist_items` - Wishlist items
- `event_logs` - Event processing logs

**Documentation**: [user-service-database.md](./02-user-service-database.md)

---

### 3. Product Service Database (`product_db`)

**Purpose**: Product catalog, categories, inventory, reviews

**Key Tables**:
- `products` - Product information
- `categories` - Product categories
- `product_categories` - Product-category relationships
- `product_variants` - Product variants (size, color, etc.)
- `product_images` - Product images
- `inventory` - Stock levels
- `reviews` - Product reviews
- `product_tags` - Product tags

**Documentation**: [product-service-database.md](./03-product-service-database.md)

---

### 4. Order Service Database (`order_db`)

**Purpose**: Orders, order items, order history, shipping

**Key Tables**:
- `orders` - Order headers
- `order_items` - Order line items
- `order_status_history` - Order status changes
- `shipping_addresses` - Shipping addresses (snapshot)
- `order_notes` - Order notes and comments

**Documentation**: [order-service-database.md](./04-order-service-database.md)

---

### 5. Payment Service Database (`payment_db`)

**Purpose**: Payments, transactions, refunds, payment methods

**Key Tables**:
- `payments` - Payment records
- `payment_transactions` - Transaction history
- `refunds` - Refund records
- `payment_methods` - Payment method tokens (encrypted)
- `payment_webhooks` - Webhook logs

**Documentation**: [payment-service-database.md](./05-payment-service-database.md)

---

### 6. Notification Service Database (`notification_db`)

**Purpose**: Notifications, email templates, notification preferences

**Key Tables**:
- `notifications` - Notification records
- `email_templates` - Email templates
- `notification_preferences` - User notification preferences
- `notification_logs` - Notification delivery logs

**Documentation**: [notification-service-database.md](./06-notification-service-database.md)

---

### 7. Cart Service Database (`cart_db`)

**Purpose**: Shopping cart management

**Key Tables**:
- `carts` - Shopping cart headers
- `cart_items` - Cart line items

**Documentation**: [cart-service-database.md](./07-cart-service-database.md)

---

### 8. Discount/Promotion Service Database (`discount_db`)

**Purpose**: Coupons, promotions, discount rules

**Key Tables**:
- `coupons` - Coupon code definitions
- `coupon_usage` - Coupon usage tracking
- `promotions` - Promotional campaigns
- `promotion_rules` - Promotion rule definitions
- `promotion_usage` - Promotion usage tracking

**Documentation**: [discount-service-database.md](./09-discount-service-database.md)

---

### 9. Shipping Service Database (`shipping_db`)

**Purpose**: Shipping rates, carriers, tracking

**Key Tables**:
- `shipping_zones` - Shipping zones
- `shipping_methods` - Shipping methods
- `shipping_rates` - Shipping rate tiers
- `shipments` - Shipment records
- `shipment_tracking` - Tracking history
- `carriers` - Carrier configuration

**Documentation**: [shipping-service-database.md](./10-shipping-service-database.md)

---

### 10. Return/Refund Service Database (`return_db`)

**Purpose**: Return requests, RMAs, refund coordination

**Key Tables**:
- `return_requests` - Return request headers
- `return_items` - Return line items
- `return_authorizations` - RMA details
- `return_status_history` - Status change history
- `return_tracking` - Return tracking history
- `refunds` - Refund records

**Documentation**: [return-service-database.md](./11-return-service-database.md)

---

## Repository Organization

This repository contains **core e-commerce services** only. Additional services (analytics, recommendations, reviews, CMS, marketing, etc.) should be implemented in separate repositories to keep this repository focused and maintainable.

---

## Cross-Service References

### How Services Reference Each Other

**❌ NO Foreign Keys Across Services**

Instead, services use:

1. **ID References** (String fields storing IDs)
   ```sql
   -- user-service database
   user_profiles.user_id VARCHAR -- References auth-service users.id
   -- No foreign key constraint!
   ```

2. **Event-Driven Synchronization**
   - Auth-service creates user → Publishes `user.created` event
   - User-service consumes event → Creates profile with same `userId`

3. **HTTP API Calls** (for validation)
   - User-service can call auth-service API to verify user exists
   - Used for critical validations only

### Reference Map

| From Service | To Service | Reference Field | Type |
|--------------|------------|-----------------|------|
| User Service | Auth Service | `user_profiles.user_id` | ID String |
| Cart Service | Auth Service | `carts.user_id` | ID String |
| Cart Service | Product Service | `cart_items.product_id` | ID String |
| Order Service | User Service | `orders.user_id` | ID String |
| Order Service | Product Service | `order_items.product_id` | ID String |
| Order Service | Cart Service | `orders.cart_id` | ID String |
| Order Service | Discount Service | `orders.coupon_code` | ID String |
| Payment Service | Order Service | `payments.order_id` | ID String |
| Shipping Service | Order Service | `shipments.order_id` | ID String |
| Return Service | Order Service | `return_requests.order_id` | ID String |
| Return Service | Payment Service | `refunds.payment_id` | ID String |
| User Service | Product Service | `wishlist_items.product_id` | ID String |

**Documentation**: [cross-service-references.md](./08-cross-service-references.md)

---

## Production Design Patterns

### 1. Indexing Strategy

**Primary Indexes**:
- All primary keys (automatic)
- Foreign keys within same database
- Unique constraints

**Performance Indexes**:
- Frequently queried fields (`email`, `userId`, `status`)
- Composite indexes for common query patterns
- Partial indexes for filtered queries

**Example**:
```sql
-- Composite index for common query pattern
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Partial index for active records only
CREATE INDEX idx_users_active ON users(email) WHERE is_active = true;
```

### 2. Partitioning Strategy

**Time-Based Partitioning** (for large tables):
- `security_audit_logs` - Partition by month
- `notifications` - Partition by month
- `order_status_history` - Partition by month

**Hash Partitioning** (for high-volume tables):
- `orders` - Partition by `user_id` hash
- `payments` - Partition by `order_id` hash

### 3. Connection Pooling

**Prisma Connection Pool**:
```typescript
// Configured in Prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings
  // max_connections=100
  // connection_timeout=10
}
```

### 4. Backup Strategy

**Automated Backups**:
- Daily full backups
- Hourly incremental backups
- Point-in-time recovery (PITR)
- Cross-region backup replication

**Retention**:
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

### 5. Monitoring & Observability

**Key Metrics**:
- Connection pool usage
- Query performance (slow queries > 1s)
- Database size growth
- Replication lag
- Lock contention

**Tools**:
- PostgreSQL `pg_stat_statements` extension
- AWS CloudWatch (for RDS)
- Custom metrics via Prometheus

---

## ER Diagrams

### Complete System ER Diagram

See [master-er-diagram.md](./00-master-er-diagram.md) for the complete system-wide ER diagram showing all services and their relationships.

### Individual Service ER Diagrams

Each service database document includes:
- Detailed ER diagram
- Table relationships
- Index information
- Constraint details

---

## Database Migration Strategy

### Development

```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Apply migration
npx prisma migrate deploy
```

### Production

1. **Create Migration**: Developer creates migration locally
2. **Review**: Migration reviewed by team
3. **Test**: Tested in staging environment
4. **Deploy**: Applied to production during maintenance window
5. **Rollback Plan**: Always have rollback migration ready

### Best Practices

- ✅ Always test migrations on staging first
- ✅ Use transactions for multi-step migrations
- ✅ Never drop columns without deprecation period
- ✅ Add indexes concurrently to avoid locks
- ✅ Monitor migration execution time

---

## Scaling Strategy

### Vertical Scaling

- Increase instance size (CPU, RAM)
- Upgrade PostgreSQL version
- Optimize queries and indexes

### Horizontal Scaling

**Read Replicas**:
- Create read replicas for read-heavy services
- Route read queries to replicas
- Write queries go to primary

**Sharding** (Future):
- Shard by `user_id` hash
- Shard by geographic region
- Use Citus extension for PostgreSQL sharding

---

## Security

### Database Security

1. **Encryption at Rest**: All databases encrypted
2. **Encryption in Transit**: SSL/TLS for all connections
3. **Access Control**: Role-based access (RBAC)
4. **Connection Security**: IP whitelisting, VPC isolation
5. **Credential Management**: Secrets in AWS Secrets Manager

### Data Protection

- **PII Encryption**: Sensitive fields encrypted
- **Password Hashing**: bcrypt with salt
- **Token Storage**: Encrypted tokens only
- **Audit Logging**: All sensitive operations logged

---

## Next Steps

1. Read individual service database documentation:
   - [Auth Service Database](./01-auth-service-database.md)
   - [User Service Database](./02-user-service-database.md)
   - [Product Service Database](./03-product-service-database.md)
   - [Order Service Database](./04-order-service-database.md)
   - [Payment Service Database](./05-payment-service-database.md)
   - [Notification Service Database](./06-notification-service-database.md)
   - [Cart Service Database](./07-cart-service-database.md)
   - [Discount Service Database](./09-discount-service-database.md)
   - [Shipping Service Database](./10-shipping-service-database.md)
   - [Return Service Database](./11-return-service-database.md)

2. Understand cross-service references:
   - [Cross-Service References](./08-cross-service-references.md)

3. View complete system diagram:
   - [Master ER Diagram](./00-master-er-diagram.md)

