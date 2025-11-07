# Master ER Diagram - Complete System

## Overview

This document provides a complete Entity-Relationship diagram showing all databases across all microservices in the e-commerce platform. Each service has its own database, and relationships between services are shown as **logical references** (not database foreign keys).

**Note**: This diagram shows all services. Services are split across repositories:

**Services in This Repository** (`ecommerce-platform`):
- Auth, User, Product, Order, Payment, Cart, Discount, Shipping, Return, Notification

**Note**: Analytics, Recommendation, and Search services are maintained in a separate repository (`analytics-platform`). See [Repository Organization](../REPOSITORY_ORGANIZATION.md) for details.

---

## Complete System ER Diagram

```mermaid
erDiagram
    %% Auth Service Database (auth_db)
    AUTH_USERS ||--o{ AUTH_USER_ROLES : "has"
    AUTH_ROLES ||--o{ AUTH_USER_ROLES : "assigned"
    AUTH_USERS ||--o{ AUTH_REFRESH_TOKENS : "has"
    AUTH_USERS ||--o{ AUTH_PASSWORD_RESET_TOKENS : "has"
    AUTH_USERS ||--o{ AUTH_EMAIL_VERIFICATION_TOKENS : "has"
    AUTH_USERS ||--o{ AUTH_SECURITY_AUDIT_LOGS : "generates"
    
    AUTH_USERS {
        string id PK
        string email UK
        string passwordHash
        boolean emailVerified
        boolean isActive
        int failedLoginAttempts
        datetime lockedUntil
        datetime createdAt
        datetime updatedAt
    }
    
    AUTH_ROLES {
        string id PK
        string name UK
        string description
        datetime createdAt
        datetime updatedAt
    }
    
    AUTH_USER_ROLES {
        string id PK
        string userId FK
        string roleId FK
        datetime createdAt
    }
    
    AUTH_REFRESH_TOKENS {
        string id PK
        string token UK
        string userId FK
        datetime expiresAt
        boolean revoked
        datetime revokedAt
        datetime createdAt
    }
    
    AUTH_PASSWORD_RESET_TOKENS {
        string id PK
        string token UK
        string userId FK
        datetime expiresAt
        boolean used
        datetime usedAt
        datetime createdAt
    }
    
    AUTH_EMAIL_VERIFICATION_TOKENS {
        string id PK
        string token UK
        string userId FK
        datetime expiresAt
        boolean verified
        datetime verifiedAt
        datetime createdAt
    }
    
    AUTH_SECURITY_AUDIT_LOGS {
        string id PK
        string userId FK
        string action
        string ipAddress
        string userAgent
        json metadata
        datetime createdAt
    }
    
    %% User Service Database (user_db)
    USER_PROFILES ||--o{ USER_ADDRESSES : "has"
    USER_PROFILES ||--o{ USER_PAYMENT_METHODS : "has"
    USER_PROFILES ||--o{ USER_PREFERENCES : "has"
    USER_PROFILES ||--o{ USER_WISHLIST_ITEMS : "has"
    
    USER_PROFILES {
        string id PK
        string userId UK "References auth.users.id"
        string email UK "Denormalized"
        string firstName
        string lastName
        string phone
        string avatarUrl
        datetime dateOfBirth
        string gender
        string preferredCurrency
        string preferredLanguage
        boolean newsletterSubscribed
        boolean marketingOptIn
        boolean isActive "Synced from auth"
        boolean emailVerified "Synced from auth"
        datetime createdAt
        datetime updatedAt
        datetime lastLoginAt
    }
    
    USER_ADDRESSES {
        string id PK
        string userId FK
        string type "shipping|billing|both"
        boolean isDefault
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
        datetime updatedAt
    }
    
    USER_PAYMENT_METHODS {
        string id PK
        string userId FK
        string type "credit_card|debit_card|paypal"
        boolean isDefault
        string cardType
        string last4
        string expiryMonth
        string expiryYear
        string cardholderName
        string billingAddressId FK
        string providerToken "Encrypted"
        datetime createdAt
        datetime updatedAt
    }
    
    USER_PREFERENCES {
        string id PK
        string userId FK
        string key UK
        string value
        datetime createdAt
        datetime updatedAt
    }
    
    USER_WISHLIST_ITEMS {
        string id PK
        string userId FK
        string productId "References product.products.id"
        string productName "Denormalized"
        string productImageUrl "Denormalized"
        string productPrice "Denormalized"
        string notes
        datetime createdAt
        datetime updatedAt
    }
    
    USER_EVENT_LOGS {
        string id PK
        string eventId UK
        string eventType
        string source
        string payload
        boolean processed
        datetime processedAt
        string error
        datetime createdAt
    }
    
    %% Product Service Database (product_db)
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has"
    PRODUCTS ||--o{ PRODUCT_CATEGORIES : "belongs_to"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "has"
    PRODUCTS ||--o{ PRODUCT_TAGS : "has"
    PRODUCTS ||--|| PRODUCT_INVENTORY : "has"
    CATEGORIES ||--o{ PRODUCT_CATEGORIES : "contains"
    
    PRODUCTS {
        string id PK
        string sku UK
        string name
        string slug UK
        string description
        string shortDescription
        decimal price
        decimal compareAtPrice
        decimal costPrice
        string status "draft|active|archived"
        boolean isVisible
        int stockQuantity
        string stockStatus "in_stock|out_of_stock|backorder"
        decimal weight
        decimal length
        decimal width
        decimal height
        string metaTitle
        string metaDescription
        json attributes
        datetime createdAt
        datetime updatedAt
        datetime publishedAt
    }
    
    CATEGORIES {
        string id PK
        string name
        string slug UK
        string description
        string parentId FK "Self-referencing"
        int level
        int sortOrder
        string imageUrl
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    PRODUCT_CATEGORIES {
        string id PK
        string productId FK
        string categoryId FK
        datetime createdAt
    }
    
    PRODUCT_VARIANTS {
        string id PK
        string productId FK
        string sku UK
        string name
        decimal price
        decimal compareAtPrice
        int stockQuantity
        string stockStatus
        json attributes "size, color, etc."
        string imageUrl
        datetime createdAt
        datetime updatedAt
    }
    
    PRODUCT_IMAGES {
        string id PK
        string productId FK
        string url
        string altText
        int sortOrder
        boolean isPrimary
        datetime createdAt
    }
    
    PRODUCT_INVENTORY {
        string id PK
        string productId FK UK
        string variantId FK "Nullable"
        int quantity
        int reservedQuantity
        int availableQuantity
        string location "warehouse_id"
        datetime lastRestockedAt
        datetime createdAt
        datetime updatedAt
    }
    
    PRODUCT_REVIEWS {
        string id PK
        string productId FK
        string userId "References auth.users.id"
        int rating "1-5"
        string title
        string comment
        boolean isVerifiedPurchase
        boolean isApproved
        int helpfulCount
        datetime createdAt
        datetime updatedAt
    }
    
    PRODUCT_TAGS {
        string id PK
        string productId FK
        string tag
        datetime createdAt
    }
    
    %% Order Service Database (order_db)
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "has"
    ORDERS ||--o{ ORDER_NOTES : "has"
    ORDERS ||--|| ORDER_SHIPPING_ADDRESSES : "shipped_to"
    
    ORDERS {
        string id PK
        string orderNumber UK
        string userId "References auth.users.id"
        string status "pending|confirmed|processing|shipped|delivered|cancelled|refunded"
        string paymentStatus "pending|paid|failed|refunded"
        decimal subtotal
        decimal taxAmount
        decimal shippingAmount
        decimal discountAmount
        decimal totalAmount
        string currency
        string paymentMethodId "References payment.payments.id"
        string shippingMethod
        string trackingNumber
        datetime estimatedDeliveryDate
        datetime shippedAt
        datetime deliveredAt
        datetime cancelledAt
        json metadata
        datetime createdAt
        datetime updatedAt
    }
    
    ORDER_ITEMS {
        string id PK
        string orderId FK
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
        string id PK
        string orderId FK
        string status
        string previousStatus
        string changedBy "user_id or system"
        string reason
        datetime createdAt
    }
    
    ORDER_SHIPPING_ADDRESSES {
        string id PK
        string orderId FK UK
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
        string id PK
        string orderId FK
        string note
        string createdBy "user_id or system"
        boolean isInternal
        datetime createdAt
    }
    
    %% Payment Service Database (payment_db)
    PAYMENTS ||--o{ PAYMENT_TRANSACTIONS : "has"
    PAYMENTS ||--o{ REFUNDS : "has"
    PAYMENT_METHODS ||--o{ PAYMENTS : "uses"
    
    PAYMENTS {
        string id PK
        string orderId "References order.orders.id"
        string userId "References auth.users.id"
        string paymentMethodId FK
        string status "pending|processing|succeeded|failed|cancelled|refunded"
        string paymentProvider "stripe|paypal|etc"
        string providerPaymentId
        decimal amount
        string currency
        string description
        json metadata
        datetime processedAt
        datetime createdAt
        datetime updatedAt
    }
    
    PAYMENT_TRANSACTIONS {
        string id PK
        string paymentId FK
        string transactionType "charge|refund|void"
        string status "pending|succeeded|failed"
        string providerTransactionId
        decimal amount
        string currency
        json providerResponse
        datetime processedAt
        datetime createdAt
    }
    
    REFUNDS {
        string id PK
        string paymentId FK
        string orderId "References order.orders.id"
        string reason
        decimal amount
        string currency
        string status "pending|processing|completed|failed"
        string providerRefundId
        json metadata
        datetime processedAt
        datetime createdAt
        datetime updatedAt
    }
    
    PAYMENT_METHODS {
        string id PK
        string userId "References auth.users.id"
        string type "credit_card|debit_card|paypal"
        string provider "stripe|paypal"
        string providerToken "Encrypted"
        string last4
        string cardType
        string expiryMonth
        string expiryYear
        boolean isDefault
        datetime createdAt
        datetime updatedAt
    }
    
    PAYMENT_WEBHOOKS {
        string id PK
        string provider
        string eventType
        string providerEventId UK
        json payload
        string status "pending|processed|failed"
        string error
        datetime processedAt
        datetime createdAt
    }
    
    %% Notification Service Database (notification_db)
    NOTIFICATIONS ||--|| NOTIFICATION_LOGS : "has"
    EMAIL_TEMPLATES ||--o{ NOTIFICATIONS : "uses"
    NOTIFICATION_PREFERENCES ||--o{ NOTIFICATIONS : "controls"
    
    NOTIFICATIONS {
        string id PK
        string userId "References auth.users.id"
        string type "email|sms|push|in_app"
        string templateId FK
        string subject
        string body
        string status "pending|sent|delivered|failed|bounced"
        json metadata
        datetime scheduledAt
        datetime sentAt
        datetime deliveredAt
        datetime createdAt
    }
    
    EMAIL_TEMPLATES {
        string id PK
        string name UK
        string subject
        string bodyHtml
        string bodyText
        json variables
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    NOTIFICATION_PREFERENCES {
        string id PK
        string userId "References auth.users.id"
        string notificationType UK
        boolean emailEnabled
        boolean smsEnabled
        boolean pushEnabled
        datetime createdAt
        datetime updatedAt
    }
    
    NOTIFICATION_LOGS {
        string id PK
        string notificationId FK UK
        string status
        string provider
        string providerMessageId
        json providerResponse
        string error
        datetime createdAt
    }
```

---

## Legend

### Relationship Types

- `||--o{` : One-to-Many (One parent, many children)
- `||--||` : One-to-One (One parent, one child)
- `}o--o{` : Many-to-Many (Many parents, many children)

### Field Types

- `PK` : Primary Key
- `FK` : Foreign Key (within same database)
- `UK` : Unique Key
- `string userId "References auth.users.id"` : Cross-service reference (no FK constraint)

---

## Cross-Service Reference Summary

### References FROM User Service

| Field | References | Service | Type |
|-------|------------|---------|------|
| `user_profiles.user_id` | `users.id` | Auth Service | ID String |
| `wishlist_items.product_id` | `products.id` | Product Service | ID String |

### References FROM Order Service

| Field | References | Service | Type |
|-------|------------|---------|------|
| `orders.user_id` | `users.id` | Auth Service | ID String |
| `order_items.product_id` | `products.id` | Product Service | ID String |
| `order_items.variant_id` | `product_variants.id` | Product Service | ID String |
| `orders.payment_method_id` | `payments.id` | Payment Service | ID String |

### References FROM Payment Service

| Field | References | Service | Type |
|-------|------------|---------|------|
| `payments.order_id` | `orders.id` | Order Service | ID String |
| `payments.user_id` | `users.id` | Auth Service | ID String |
| `refunds.order_id` | `orders.id` | Order Service | ID String |

### References FROM Product Service

| Field | References | Service | Type |
|-------|------------|---------|------|
| `product_reviews.user_id` | `users.id` | Auth Service | ID String |

### References FROM Cart Service

| Field | References | Service | Type |
|-------|------------|---------|------|
| `carts.user_id` | `users.id` | Auth Service | ID String |
| `cart_items.product_id` | `products.id` | Product Service | ID String |
| `cart_items.variant_id` | `product_variants.id` | Product Service | ID String |

### References FROM Discount Service

| Field | References | Service | Type |
|-------|------------|---------|------|
| `coupon_usage.user_id` | `users.id` | Auth Service | ID String |
| `coupon_usage.order_id` | `orders.id` | Order Service | ID String |
| `promotion_usage.user_id` | `users.id` | Auth Service | ID String |
| `promotion_usage.order_id` | `orders.id` | Order Service | ID String |

### References FROM Shipping Service

| Field | References | Service | Type |
|-------|------------|---------|------|
| `shipments.order_id` | `orders.id` | Order Service | ID String |

### References FROM Return Service

| Field | References | Service | Type |
|-------|------------|---------|------|
| `return_requests.order_id` | `orders.id` | Order Service | ID String |
| `return_requests.user_id` | `users.id` | Auth Service | ID String |
| `return_items.order_item_id` | `order_items.id` | Order Service | ID String |
| `return_items.product_id` | `products.id` | Product Service | ID String |
| `refunds.payment_id` | `payments.id` | Payment Service | ID String |
| `refunds.order_id` | `orders.id` | Order Service | ID String |
| `refunds.user_id` | `users.id` | Auth Service | ID String |

---

## Database Statistics (Estimated)

### Table Counts

- **Auth Service**: 7 tables
- **User Service**: 6 tables
- **Product Service**: 8 tables
- **Order Service**: 5 tables
- **Payment Service**: 5 tables
- **Notification Service**: 4 tables
- **Cart Service**: 2 tables
- **Discount Service**: 5 tables
- **Shipping Service**: 6 tables
- **Return Service**: 6 tables

**Total**: 54 tables across 10 databases

### Estimated Data Volumes (Production)

| Service | Estimated Records | Growth Rate |
|---------|-------------------|-------------|
| Auth Service | 1M users | 10K/month |
| User Service | 1M profiles | 10K/month |
| Product Service | 100K products | 1K/month |
| Order Service | 10M orders | 100K/month |
| Payment Service | 10M payments | 100K/month |
| Notification Service | 50M notifications | 500K/month |

---

## Data Consistency Patterns

### Eventual Consistency

1. **User Registration**:
   - Auth Service creates user → Publishes `user.created`
   - User Service consumes event → Creates profile
   - **Consistency**: Eventual (seconds to minutes)

2. **Order Creation**:
   - Order Service creates order → Publishes `order.created`
   - Payment Service consumes event → Creates payment record
   - Inventory Service consumes event → Reserves inventory
   - **Consistency**: Eventual (seconds)

3. **Product Updates**:
   - Product Service updates product → Publishes `product.updated`
   - Order Service consumes event → Updates order item snapshots (if needed)
   - **Consistency**: Eventual (minutes)

### Strong Consistency (Synchronous)

1. **Payment Processing**:
   - Payment Service processes payment → Calls Order Service API
   - Order Service updates order status synchronously
   - **Consistency**: Immediate

2. **Inventory Check**:
   - Order Service checks inventory → Calls Product Service API
   - Product Service validates stock synchronously
   - **Consistency**: Immediate

---

## Next Steps

- View individual service database designs:
  - [Auth Service Database](./01-auth-service-database.md)
  - [User Service Database](./02-user-service-database.md)
  - [Product Service Database](./03-product-service-database.md)
  - [Order Service Database](./04-order-service-database.md)
  - [Payment Service Database](./05-payment-service-database.md)
  - [Notification Service Database](./06-notification-service-database.md)

- Understand cross-service references:
  - [Cross-Service References](./08-cross-service-references.md)

