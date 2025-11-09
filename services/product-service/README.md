# Product Service

Enterprise-grade product catalog management service for the e-commerce platform. Handles products, categories, variants, inventory, reviews, questions, and more.

## Features

### Core Product Management
- **Product CRUD**: Create, read, update, delete products
- **Product Search**: Advanced search with filters (price, category, rating, badges, stock status)
- **Product Filtering**: Filter by category, price range, in-stock status, badges, rating
- **Product Sorting**: Sort by price, rating, popularity, newest, name
- **Product Recommendations**: Get product recommendations based on views and purchases
- **Product View Tracking**: Track product views for analytics
- **Product Badges**: Manage product badges (new, sale, featured, bestseller, etc.)

### Category Management
- **Category CRUD**: Create, read, update, delete categories
- **Category Hierarchy**: Support for parent-child category relationships
- **Category Filtering**: Filter categories by parent, level, active status
- **Root Categories**: Get root-level categories

### Product Variants
- **Variant Management**: Create, read, update, delete product variants
- **Variant SKU**: Unique SKU per variant
- **Variant Pricing**: Individual pricing for variants
- **Variant Stock**: Stock management per variant

### Product Images
- **Image Management**: Create, read, update, delete product images
- **Primary Image**: Set primary image for products
- **Image Ordering**: Sort order for images
- **Alt Text**: SEO-friendly alt text for images

### Product Tags
- **Tag Management**: Add, remove tags from products
- **Tag Filtering**: Filter products by tags
- **Tag Search**: Search products by tags

### Inventory Management
- **Inventory Tracking**: Track quantity, reserved quantity, available quantity
- **Inventory Operations**: Reserve, release, adjust inventory
- **Location Tracking**: Track inventory location
- **Restock Tracking**: Track last restocked date
- **Variant Inventory**: Support for variant-level inventory

### Product Reviews
- **Review Management**: Create, read, moderate reviews
- **Review Ratings**: 1-5 star rating system
- **Review Moderation**: Approve/reject reviews (admin)
- **Verified Purchases**: Mark reviews as verified purchases
- **Helpful Votes**: Track helpful votes on reviews
- **Review Filtering**: Filter by rating, approval status

### Product Q&A
- **Questions & Answers**: Users can ask questions, admins/verified purchasers can answer
- **Question Moderation**: Approve/reject questions
- **Question Upvotes**: Track helpful questions
- **Guest Questions**: Support for guest questions

### Stock Alerts
- **Stock Alerts**: Users can subscribe to stock alerts
- **Email Notifications**: Email when product is back in stock
- **Variant Alerts**: Support for variant-specific alerts
- **Alert Expiration**: Automatic expiration of alerts

### Product Comparisons
- **Product Comparison**: Compare up to 4 products side-by-side
- **Saved Comparisons**: Save comparisons for later
- **Comparison History**: View comparison history

### Price History
- **Price Tracking**: Track price changes over time
- **Price History**: View price history for products
- **Price Change Reasons**: Track reasons for price changes

### Search History
- **Search Tracking**: Track search queries
- **Popular Searches**: Get popular search queries
- **Recent Searches**: View recent search history
- **Search Analytics**: Analyze search patterns

## Architecture

This service follows Clean Architecture principles:

- **Core Layer**: Entities and use cases (business logic)
- **Application Layer**: Controllers and DTOs
- **Infrastructure Layer**: Database repositories, caching, external services
- **Ports Layer**: Interfaces for repositories and services

## Setup

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0
- PostgreSQL 16+
- Redis (optional, for caching)
- LocalStack (optional, for local AWS services emulation)

### Environment Variables

Create a `.env` file in the `services/product-service` directory (see `.env.example` for reference):

```env
NODE_ENV=development
PORT=3003
DATABASE_URL=postgresql://product_user:product_pass@localhost:5434/product_db
JWT_SECRET=your-32-character-minimum-secret-key-here
REDIS_URL=redis://localhost:6379
AUTH_SERVICE_URL=http://localhost:3001
AWS_REGION=us-east-1
EVENT_PUBLISHER_TYPE=mock
LOCALSTACK_ENDPOINT=http://localhost:4566
```

### Database Setup

1. **Run migrations**:
```bash
cd services/product-service
npm run prisma:migrate:deploy
```

2. **Generate Prisma client**:
```bash
npm run prisma:generate
```

### Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Products

- `GET /api/v1/products` - List products (with filters)
- `GET /api/v1/products/:id` - Get product by ID
- `GET /api/v1/products/search?q=query` - Search products
- `GET /api/v1/products/:id/recommendations` - Get product recommendations
- `POST /api/v1/products/:id/view` - Track product view
- `POST /api/v1/products` - Create product (admin)
- `PUT /api/v1/products/:id` - Update product (admin)
- `DELETE /api/v1/products/:id` - Delete product (admin)
- `PUT /api/v1/products/:id/badges` - Update product badges (admin)

### Categories

- `GET /api/v1/categories` - List categories
- `GET /api/v1/categories/:id` - Get category by ID
- `GET /api/v1/categories/slug/:slug` - Get category by slug
- `POST /api/v1/categories` - Create category (admin)
- `PUT /api/v1/categories/:id` - Update category (admin)
- `DELETE /api/v1/categories/:id` - Delete category (admin)

### Product Reviews

- `GET /api/v1/products/:id/reviews` - Get product reviews
- `POST /api/v1/products/:id/reviews` - Create review (authenticated)
- `GET /api/v1/products/reviews/pending` - Get pending reviews (admin)
- `POST /api/v1/products/reviews/:reviewId/moderate` - Moderate review (admin)

### Product Questions

- `GET /api/v1/products/:id/questions` - Get product questions
- `POST /api/v1/products/:id/questions` - Ask question (authenticated)
- `POST /api/v1/products/questions/:questionId/answer` - Answer question (admin)

### Stock Alerts

- `GET /api/v1/products/stock-alerts` - Get user's stock alerts (authenticated)
- `POST /api/v1/products/:id/stock-alerts` - Create stock alert (authenticated)

### Product Comparisons

- `GET /api/v1/products/comparisons` - Get user's comparisons (authenticated)
- `POST /api/v1/products/comparisons` - Create comparison (authenticated)
- `GET /api/v1/products/comparisons/:comparisonId` - Get comparison (authenticated)

## Enterprise Features

### Caching
- Redis caching for products, categories, and frequently accessed data
- Cache invalidation on updates
- Configurable TTL

### Rate Limiting
- Global rate limiting
- Stricter limits for write operations
- Redis-backed distributed rate limiting

### Health Checks
- `/health` - Health check endpoint
- `/ready` - Readiness check endpoint
- Database connectivity checks

### Security
- JWT authentication
- Role-based access control (admin/user)
- Input validation
- SQL injection protection (Prisma)
- XSS protection (Helmet)

### Logging
- Structured logging with Winston
- Request ID tracking
- Log levels (error, warn, info, debug)

### Error Handling
- Centralized error handling
- Standardized error responses
- Request ID in error responses

### API Documentation
- OpenAPI/Swagger documentation at `/api-docs`
- Interactive API explorer

## Database Schema

The service uses PostgreSQL with the following main models:

- `Product` - Main product entity
- `Category` - Product categories with hierarchy
- `ProductVariant` - Product variants (size, color, etc.)
- `ProductImage` - Product images
- `ProductTag` - Product tags
- `ProductInventory` - Inventory tracking
- `ProductReview` - Product reviews
- `ProductQuestion` - Product Q&A
- `StockAlert` - Stock alerts
- `ProductComparison` - Product comparisons
- `PriceHistory` - Price change history
- `ProductSearchHistory` - Search query history

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Development

### Code Structure

```
src/
├── core/                 # Business logic
│   ├── entities/         # Domain entities
│   └── use-cases/        # Use cases
├── application/          # Application layer
│   ├── controllers/      # HTTP controllers
│   └── utils/            # Utilities
├── infrastructure/       # Infrastructure
│   ├── database/         # Database repositories
│   ├── cache/            # Caching
│   ├── health/           # Health checks
│   └── logging/          # Logging
├── ports/                # Interfaces
│   └── interfaces/       # Repository interfaces
├── routes/               # Route definitions
└── middleware/           # Express middleware
```

### Adding New Features

1. Create entity in `src/core/entities/`
2. Create repository interface in `src/ports/interfaces/`
3. Implement repository in `src/infrastructure/database/`
4. Create use case in `src/core/use-cases/`
5. Create controller in `src/application/controllers/`
6. Create routes in `src/routes/`
7. Register in `src/di/container.ts`
8. Register routes in `src/index.ts`

## Production Deployment

### Environment Variables

Set the following environment variables in production:

- `NODE_ENV=production`
- `DATABASE_URL` - Production database URL
- `JWT_SECRET` - Strong secret key (32+ characters)
- `REDIS_URL` - Production Redis URL
- `AWS_REGION` - AWS region
- `SNS_TOPIC_ARN` - SNS topic for events
- `SQS_QUEUE_URL` - SQS queue for events
- `EVENT_PUBLISHER_TYPE=sns` - Use SNS for events
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

### Database Migrations

Run migrations in production:

```bash
npm run prisma:migrate:deploy
```

### Monitoring

- Health checks: Monitor `/health` and `/ready` endpoints
- Logging: Centralized logging with structured logs
- Metrics: Track request latency, error rates, etc.
- Alerts: Set up alerts for health check failures

## License

Part of the e-commerce platform project.

