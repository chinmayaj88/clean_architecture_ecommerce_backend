# Services Architecture

## Table of Contents

1. [Overview](#overview)
2. [Auth Service](#auth-service)
3. [User Service](#user-service)
4. [Service Independence](#service-independence)
5. [Service Responsibilities](#service-responsibilities)

---

## Overview

The platform consists of multiple microservices, each responsible for a specific business domain. Each service is:

- **Independently deployable**
- **Independently scalable**
- **Has its own database**
- **Follows Clean Architecture**
- **Communicates via HTTP and Events**

---

## Auth Service

**Port**: `3001`  
**Database**: PostgreSQL (`auth_db`)  
**Purpose**: Authentication, authorization, and user session management

### Responsibilities

1. **User Authentication**
   - User registration
   - Login/logout
   - Password management (reset, change)
   - Email verification

2. **Authorization**
   - JWT token generation and validation
   - Refresh token management
   - Role-Based Access Control (RBAC)
   - Token refresh

3. **Security & Advanced Features**
   - Account lockout after failed attempts
   - Security audit logging
   - Password hashing (bcrypt)
   - **Multi-Factor Authentication (MFA/TOTP)** - TOTP-based 2FA with backup codes
   - **Device Management** - Track, manage, and revoke devices
   - **Login History** - Detailed login tracking with IP, location, device info
   - **Session Management** - Active session tracking and revocation
   - **Suspicious Login Detection** - IP-based security with risk scoring

4. **Event Publishing**
   - Publishes `user.created` events
   - Publishes `user.deactivated` events
   - Publishes password reset events

### Key Components

#### Core Domain Entities
- `User` - User account information (with MFA fields)
- `Role` - RBAC roles (user, admin, etc.)
- `RefreshToken` - JWT refresh tokens
- `PasswordResetToken` - Password reset tokens
- `EmailVerificationToken` - Email verification tokens
- `SecurityAuditLog` - Security event logs
- `Device` - Device tracking and management
- `LoginHistory` - Detailed login history
- `UserSession` - Active session management
- `MFABackupCode` - MFA backup codes

#### Use Cases
- `RegisterUserUseCase` - User registration
- `LoginUseCase` - User authentication with lockout protection
- `RefreshTokenUseCase` - Token refresh
- `LogoutUseCase` - Session termination
- `ForgotPasswordUseCase` - Password reset initiation
- `ResetPasswordUseCase` - Password reset completion
- `VerifyEmailUseCase` - Email verification
- `ChangePasswordUseCase` - Password change
- `DeactivateAccountUseCase` - Account deactivation
- `GetDevicesUseCase` - Get user devices
- `UpdateDeviceUseCase` - Update device information
- `RevokeDeviceUseCase` - Revoke device access
- `GetLoginHistoryUseCase` - Get login history
- `GetSessionsUseCase` - Get active sessions
- `RevokeSessionUseCase` - Revoke specific session
- `RevokeAllSessionsUseCase` - Revoke all sessions
- `EnableMFAUseCase` - Enable MFA/TOTP
- `VerifyMFAUseCase` - Verify MFA code
- `DisableMFAUseCase` - Disable MFA
- `DetectSuspiciousLoginUseCase` - Detect suspicious login patterns

#### Infrastructure
- **Database**: Prisma ORM with PostgreSQL
- **Caching**: Redis (optional, for rate limiting)
- **Events**: AWS SNS (or LocalStack for local dev)
- **Security**: bcryptjs, jsonwebtoken

### API Endpoints

```
POST   /api/v1/auth/register              - Register new user
POST   /api/v1/auth/login                 - Login user
POST   /api/v1/auth/refresh               - Refresh access token
POST   /api/v1/auth/logout                - Logout user
POST   /api/v1/auth/forgot-password       - Request password reset
POST   /api/v1/auth/reset-password        - Reset password
POST   /api/v1/auth/verify-email           - Verify email address
POST   /api/v1/auth/resend-verification   - Resend verification email
POST   /api/v1/auth/change-password        - Change password (authenticated)
POST   /api/v1/auth/deactivate            - Deactivate account (authenticated)
GET    /health                            - Health check
GET    /ready                             - Readiness check
GET    /api-docs                          - OpenAPI documentation
```

### Database Schema

```sql
-- Core Tables
users                          -- User accounts (with MFA fields)
roles                          -- RBAC roles
user_roles                     -- User-role assignments
refresh_tokens                 -- JWT refresh tokens
password_reset_tokens         -- Password reset tokens
email_verification_tokens      -- Email verification tokens
security_audit_logs            -- Security event logs

-- Advanced Security Features
devices                        -- Device tracking and management
login_history                  -- Detailed login history
user_sessions                  -- Active session management
mfa_backup_codes              -- MFA backup codes
```

### Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@host:5432/auth_db

# JWT
JWT_SECRET=<32+ char secret>
JWT_REFRESH_SECRET=<32+ char secret>
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# Redis (optional)
REDIS_URL=redis://localhost:6379

# AWS SNS
AWS_REGION=us-east-1
EVENT_PUBLISHER_TYPE=sns
LOCALSTACK_ENDPOINT=http://localhost:4566  # Local dev only
```

---

## User Service

**Port**: `3002`  
**Database**: PostgreSQL (`user_db`)  
**Purpose**: User profile management and e-commerce features

### Responsibilities

1. **User Profile Management**
   - Create/read/update user profiles
   - User preferences
   - Profile information (name, phone, avatar, etc.)
   - **Profile Completion Score** - Automatic calculation (0-100)

2. **Address Management**
   - CRUD operations for user addresses
   - Multiple addresses per user
   - Default address selection

3. **Payment Methods**
   - CRUD operations for payment methods
   - Multiple payment methods per user
   - Secure storage (tokenization in production)

4. **Wishlist Management**
   - Add/remove items from wishlist
   - Retrieve user wishlist

5. **Recently Viewed Products**
   - Track product views with timestamps
   - Retrieve recently viewed products
   - Auto-cleanup old views

6. **User Activity Tracking**
   - Track all user actions (views, searches, purchases)
   - Activity timeline and analytics
   - User behavior statistics

7. **Notification Preferences**
   - Granular notification settings per channel (email, SMS, push)
   - Category-based preferences (orders, promotions, reviews, etc.)
   - Frequency settings (real-time, daily, weekly, never)

8. **GDPR Compliance**
   - Data export (export all user data in JSON format)
   - Account deletion (right to be forgotten)
   - Privacy consent management

9. **Event Consumption**
   - Consumes `user.created` events from auth-service
   - Creates user profile when user registers

### Key Components

#### Core Domain Entities
- `UserProfile` - User profile information (with completion score)
- `Address` - User addresses
- `PaymentMethod` - Payment methods
- `UserPreference` - User preferences
- `WishlistItem` - Wishlist items
- `RecentlyViewedProduct` - Recently viewed products tracking
- `UserActivity` - User activity tracking
- `NotificationPreference` - Granular notification preferences

#### Use Cases
- `CreateUserProfileUseCase` - Create profile (from event)
- `GetUserProfileUseCase` - Get user profile
- `UpdateUserProfileUseCase` - Update profile (auto-calculates completion score)
- `CreateAddressUseCase` - Add address
- `GetAddressesUseCase` - Get user addresses
- `UpdateAddressUseCase` - Update address
- `DeleteAddressUseCase` - Delete address
- `CreatePaymentMethodUseCase` - Add payment method
- `UpdatePaymentMethodUseCase` - Update payment method
- `DeletePaymentMethodUseCase` - Delete payment method
- `AddToWishlistUseCase` - Add to wishlist
- `GetWishlistUseCase` - Get wishlist
- `TrackProductViewUseCase` - Track product view
- `GetRecentlyViewedProductsUseCase` - Get recently viewed products
- `TrackUserActivityUseCase` - Track user activity
- `GetUserActivityUseCase` - Get activity history
- `GetUserActivityStatsUseCase` - Get activity statistics
- `CalculateProfileCompletionScoreUseCase` - Calculate profile completion
- `UpdateNotificationPreferenceUseCase` - Update notification preference
- `GetNotificationPreferencesUseCase` - Get notification preferences
- `ExportUserDataUseCase` - Export all user data (GDPR)
- `DeleteUserDataUseCase` - Delete all user data (GDPR)
- `HandleUserCreatedEventUseCase` - Process user.created event

#### Infrastructure
- **Database**: Prisma ORM with PostgreSQL
- **Caching**: Redis (optional)
- **Events**: AWS SQS consumer (or LocalStack)
- **Auth**: HTTP client to auth-service for RBAC

### API Endpoints

#### Profile Management
```
GET    /api/v1/users/:userId              - Get user profile
PUT    /api/v1/users/:userId              - Update user profile
POST   /api/v1/users/:userId/profile/completion-score - Calculate completion score
```

#### Addresses
```
POST   /api/v1/users/:userId/addresses    - Create address
GET    /api/v1/users/:userId/addresses    - Get addresses
PUT    /api/v1/users/:userId/addresses/:id - Update address
DELETE /api/v1/users/:userId/addresses/:id - Delete address
```

#### Payment Methods
```
POST   /api/v1/users/:userId/payment-methods - Create payment method
PUT    /api/v1/users/:userId/payment-methods/:id - Update payment method
DELETE /api/v1/users/:userId/payment-methods/:id - Delete payment method
```

#### Wishlist
```
POST   /api/v1/users/:userId/wishlist    - Add to wishlist
GET    /api/v1/users/:userId/wishlist    - Get wishlist
DELETE /api/v1/users/:userId/wishlist/:itemId - Remove from wishlist
```

#### Recently Viewed Products
```
POST   /api/v1/users/:userId/recently-viewed - Track product view
GET    /api/v1/users/:userId/recently-viewed - Get recently viewed products
```

#### Activity Tracking
```
POST   /api/v1/users/:userId/activity     - Track user activity
GET    /api/v1/users/:userId/activity     - Get activity history
GET    /api/v1/users/:userId/activity/stats - Get activity statistics
```

#### Notification Preferences
```
GET    /api/v1/users/:userId/notification-preferences - Get preferences
PUT    /api/v1/users/:userId/notification-preferences - Update preference
```

#### GDPR Compliance
```
GET    /api/v1/users/:userId/data/export  - Export all user data
DELETE /api/v1/users/:userId/data         - Delete all user data
```

#### Health & Documentation
```
GET    /health                           - Health check
GET    /ready                            - Readiness check
GET    /api-docs                         - OpenAPI documentation
```

### Database Schema

```sql
-- Core Tables
user_profiles              -- User profile information (with completion score)
addresses                  -- User addresses
payment_methods           -- Payment methods
user_preferences           -- User preferences
wishlist_items             -- Wishlist items
event_logs                 -- Event processing logs

-- Enhanced Features
recently_viewed_products   -- Recently viewed products tracking
user_activities           -- User activity tracking
notification_preferences  -- Granular notification preferences
```

### Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3002

# Database
DATABASE_URL=postgresql://user:pass@host:5432/user_db

# Auth Service Integration
AUTH_SERVICE_URL=http://auth-service:3001
AUTH_SERVICE_API_KEY=<optional-api-key>

# Redis (optional)
REDIS_URL=redis://localhost:6379

# AWS SQS
SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/queue
AWS_REGION=us-east-1
LOCALSTACK_ENDPOINT=http://localhost:4566  # Local dev only
```

---

## Product Service

**Port**: `3003`  
**Database**: PostgreSQL (`product_db`)  
**Purpose**: Product catalog management with advanced e-commerce features

### Responsibilities

1. **Product Catalog Management**
   - CRUD operations for products
   - Product variants and inventory
   - Product images and media
   - Categories and tags
   - Product visibility and status management

2. **Advanced Search & Filtering**
   - Full-text search with relevance scoring
   - Multi-criteria filtering (price, category, rating, stock, badges)
   - Faceted search capabilities
   - Sort options (price, rating, popularity, newest, relevance)
   - Search history tracking

3. **Product Recommendations**
   - "Customers who viewed this also viewed"
   - Related products by category
   - Popular products
   - Trending products
   - Personalized recommendations

4. **Product Q&A Section**
   - Ask questions about products
   - Answer questions (verified purchasers or admins)
   - Upvote helpful answers
   - Q&A moderation workflow

5. **Review System & Moderation**
   - Product reviews with ratings (1-5 stars)
   - Review moderation workflow (approve/reject)
   - Review helpfulness voting
   - Verified purchase badges
   - Review statistics (average rating, distribution)

6. **Product Badges**
   - New product badge
   - Sale/On Sale badge
   - Featured product badge
   - Bestseller badge
   - Trending badge
   - Limited stock badge

7. **Stock Management**
   - Stock quantity tracking
   - Stock alerts (notify when back in stock)
   - Low stock notifications
   - Stock status management

8. **Product Analytics**
   - View count tracking
   - Purchase count tracking
   - Search count tracking
   - Product performance metrics

9. **Product Comparisons**
   - Compare up to 4 products side-by-side
   - Comparison features (price, specs, ratings, reviews)
   - Save comparisons
   - Share comparisons

10. **Price History**
    - Track price changes over time
    - Price change reasons
    - Historical pricing data

### Key Components

#### Core Domain Entities
- `Product` - Product information (with badges, analytics)
- `Category` - Product categories
- `ProductCategory` - Product-category relationships
- `ProductVariant` - Product variants (size, color, etc.)
- `ProductImage` - Product images
- `ProductInventory` - Inventory management
- `ProductReview` - Product reviews
- `ProductTag` - Product tags
- `ProductQuestion` - Q&A questions and answers
- `StockAlert` - Stock alert subscriptions
- `RecentlyViewedProduct` - Recently viewed products
- `ProductComparison` - Product comparisons
- `PriceHistory` - Price history tracking
- `ProductSearchHistory` - Search history

#### Use Cases
- `CreateProductUseCase` - Create product
- `GetProductUseCase` - Get product by ID
- `ListProductsUseCase` - List products with filters
- `UpdateProductUseCase` - Update product
- `DeleteProductUseCase` - Delete product
- `SearchProductsUseCase` - Advanced search
- `GetProductRecommendationsUseCase` - Get recommendations
- `TrackProductViewUseCase` - Track product view
- `CreateProductQuestionUseCase` - Ask question
- `GetProductQuestionsUseCase` - Get questions
- `AnswerProductQuestionUseCase` - Answer question
- `CreateProductReviewUseCase` - Create review
- `GetProductReviewsUseCase` - Get reviews with stats
- `ModerateReviewUseCase` - Moderate reviews
- `CreateStockAlertUseCase` - Create stock alert
- `GetStockAlertsUseCase` - Get stock alerts
- `CreateProductComparisonUseCase` - Create comparison
- `GetProductComparisonUseCase` - Get comparison
- `UpdateProductBadgesUseCase` - Update badges

#### Infrastructure
- **Database**: Prisma ORM with PostgreSQL
- **Caching**: Redis (for product caching)
- **Search**: Full-text search with PostgreSQL (can be enhanced with Elasticsearch)
- **Auth**: JWT verification for protected endpoints

### API Endpoints

#### Product Management
```
GET    /api/v1/products                   - List products (with filters)
GET    /api/v1/products/:id               - Get product by ID
POST   /api/v1/products                   - Create product (admin)
PUT    /api/v1/products/:id               - Update product (admin)
DELETE /api/v1/products/:id               - Delete product (admin)
```

#### Search & Recommendations
```
GET    /api/v1/products/search            - Advanced search
GET    /api/v1/products/:id/recommendations - Get recommendations
POST   /api/v1/products/:id/view          - Track product view
```

#### Product Q&A
```
POST   /api/v1/products/:id/questions    - Ask a question
GET    /api/v1/products/:id/questions     - Get questions
POST   /api/v1/products/questions/:questionId/answer - Answer question (admin)
```

#### Reviews & Moderation
```
POST   /api/v1/products/:id/reviews       - Create review
GET    /api/v1/products/:id/reviews       - Get reviews with stats
GET    /api/v1/products/reviews/pending   - Get pending reviews (admin)
POST   /api/v1/products/reviews/:reviewId/moderate - Moderate review (admin)
```

#### Stock Alerts
```
POST   /api/v1/products/:id/stock-alerts  - Create stock alert
GET    /api/v1/products/stock-alerts      - Get user's stock alerts
```

#### Product Comparisons
```
POST   /api/v1/products/comparisons       - Create comparison
GET    /api/v1/products/comparisons       - Get user comparisons
GET    /api/v1/products/comparisons/:comparisonId - Get comparison details
```

#### Product Badges (Admin)
```
PUT    /api/v1/products/:id/badges        - Update product badges
```

#### Health & Documentation
```
GET    /health                            - Health check
GET    /ready                             - Readiness check
GET    /api-docs                          - OpenAPI documentation
```

### Database Schema

```sql
-- Core Tables
products                    -- Product catalog
categories                  -- Product categories
product_categories         -- Product-category relationships
product_variants           -- Product variants
product_images             -- Product images
product_inventory          -- Inventory management
product_reviews            -- Product reviews
product_tags               -- Product tags

-- Enhanced Features
product_questions          -- Q&A questions and answers
stock_alerts              -- Stock alert subscriptions
recently_viewed_products  -- Recently viewed products
product_comparisons       -- Product comparisons
price_history            -- Price history tracking
product_search_history    -- Search history
```

### Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3003

# Database
DATABASE_URL=postgresql://user:pass@host:5432/product_db

# JWT (for token verification)
JWT_SECRET=<32+ char secret>

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Auth Service Integration
AUTH_SERVICE_URL=http://auth-service:3001
```

---

## Service Independence

### Database Per Service

Each service has its **own database**:
- ✅ No shared databases
- ✅ Independent schema evolution
- ✅ Independent scaling
- ✅ Data isolation

### Communication

Services communicate via:
1. **HTTP REST APIs** (synchronous)
   - User-service → Auth-service for RBAC
   - Configurable via `AUTH_SERVICE_URL`

2. **Event-Driven** (asynchronous)
   - Auth-service publishes events → SNS
   - User-service consumes events → SQS
   - Loose coupling, eventual consistency

### Deployment Independence

Each service can be:
- ✅ Deployed independently
- ✅ Scaled independently
- ✅ Updated independently
- ✅ Rolled back independently

---

## Service Responsibilities

### Auth Service

**Owns**:
- User authentication data
- JWT tokens
- Roles and permissions
- Security audit logs

**Does NOT Own**:
- User profile data
- User addresses
- Payment methods
- Wishlist items

### User Service

**Owns**:
- User profile data
- Addresses
- Payment methods
- Wishlist items
- Recently viewed products
- User activity tracking
- Notification preferences

**Does NOT Own**:
- Authentication credentials
- JWT tokens
- Roles (reads from JWT)

### Product Service

**Owns**:
- Product catalog
- Categories
- Product reviews
- Product Q&A
- Stock alerts
- Product comparisons
- Price history

**Does NOT Own**:
- User data (references by ID only)
- Order data
- Cart data

---

## Service Interaction Flow

### User Registration Flow

```
1. Client → Auth Service: POST /register
2. Auth Service:
   - Creates user in auth_db
   - Generates JWT tokens
   - Publishes "user.created" event → SNS
3. User Service (async):
   - Consumes "user.created" event ← SQS
   - Creates user profile in user_db
4. Response to Client:
   - Access token + refresh token
```

### User Login Flow

```
1. Client → Auth Service: POST /login
2. Auth Service:
   - Validates credentials
   - Checks account lockout
   - Generates JWT tokens
   - Logs security event
3. Response to Client:
   - Access token + refresh token
```

### Get User Profile Flow

```
1. Client → User Service: GET /users/:userId
   - Includes JWT token in Authorization header
2. User Service:
   - Validates JWT (decodes locally)
   - Checks RBAC permissions
   - Fetches profile from user_db
3. Response to Client:
   - User profile data
```

---

## Next Steps

- [Infrastructure](./04-infrastructure.md) - Learn about databases, cache, etc.
- [Communication](./05-communication.md) - Understand service communication patterns

