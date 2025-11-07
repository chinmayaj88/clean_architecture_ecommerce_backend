# Product Service Database Design

## Overview

**Database Name**: `product_db`  
**Service**: Product Service  
**Purpose**: Product catalog, categories, inventory, variants, reviews  
**Technology**: PostgreSQL 16+  
**ORM**: Prisma

---

## ER Diagram

```mermaid
erDiagram
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has"
    PRODUCTS ||--o{ PRODUCT_CATEGORIES : "belongs_to"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : "has"
    PRODUCTS ||--o{ PRODUCT_TAGS : "has"
    PRODUCTS ||--|| PRODUCT_INVENTORY : "has"
    CATEGORIES ||--o{ PRODUCT_CATEGORIES : "contains"
    CATEGORIES ||--o{ CATEGORIES : "parent_category"
    
    PRODUCTS {
        string id PK "cuid()"
        string sku UK "Unique SKU"
        string name "Indexed"
        string slug UK "URL-friendly"
        text description
        text shortDescription
        decimal price "Indexed"
        decimal compareAtPrice
        decimal costPrice
        string status "draft|active|archived, indexed"
        boolean isVisible "Default: true"
        int stockQuantity "Denormalized"
        string stockStatus "in_stock|out_of_stock|backorder"
        decimal weight
        decimal length
        decimal width
        decimal height
        string metaTitle "SEO"
        text metaDescription "SEO"
        json attributes "Flexible attributes"
        datetime createdAt
        datetime updatedAt
        datetime publishedAt
    }
    
    CATEGORIES {
        string id PK "cuid()"
        string name "Indexed"
        string slug UK "URL-friendly"
        text description
        string parentId FK "Self-referencing"
        int level "Category depth"
        int sortOrder
        string imageUrl
        boolean isActive "Default: true, indexed"
        datetime createdAt
        datetime updatedAt
    }
    
    PRODUCT_CATEGORIES {
        string id PK "cuid()"
        string productId FK "References products.id"
        string categoryId FK "References categories.id"
        datetime createdAt
        unique productId_categoryId "Composite unique"
    }
    
    PRODUCT_VARIANTS {
        string id PK "cuid()"
        string productId FK "References products.id, indexed"
        string sku UK "Unique SKU"
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
        string id PK "cuid()"
        string productId FK "References products.id, indexed"
        string url "Image URL"
        string altText "Accessibility"
        int sortOrder "Display order"
        boolean isPrimary "Default: false"
        datetime createdAt
    }
    
    PRODUCT_INVENTORY {
        string id PK "cuid()"
        string productId FK UK "References products.id"
        string variantId FK "Nullable, references variants.id"
        int quantity "Available quantity"
        int reservedQuantity "Reserved for orders"
        int availableQuantity "quantity - reservedQuantity"
        string location "warehouse_id"
        datetime lastRestockedAt
        datetime createdAt
        datetime updatedAt
    }
    
    PRODUCT_REVIEWS {
        string id PK "cuid()"
        string productId FK "References products.id, indexed"
        string userId "References auth.users.id"
        int rating "1-5, indexed"
        string title
        text comment
        boolean isVerifiedPurchase "Default: false"
        boolean isApproved "Default: false, indexed"
        int helpfulCount "Default: 0"
        datetime createdAt "Indexed"
        datetime updatedAt
    }
    
    PRODUCT_TAGS {
        string id PK "cuid()"
        string productId FK "References products.id, indexed"
        string tag "Indexed"
        datetime createdAt
    }
```

---

## Table Specifications

### 1. `products` Table

**Purpose**: Core product information

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique product identifier |
| `sku` | VARCHAR(100) | UNIQUE, NOT NULL | Stock Keeping Unit |
| `name` | VARCHAR(255) | NOT NULL, INDEXED | Product name |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly identifier |
| `description` | TEXT | NULLABLE | Full product description |
| `short_description` | TEXT | NULLABLE | Brief description |
| `price` | DECIMAL(10,2) | NOT NULL, INDEXED | Selling price |
| `compare_at_price` | DECIMAL(10,2) | NULLABLE | Original price (for discounts) |
| `cost_price` | DECIMAL(10,2) | NULLABLE | Cost price (internal) |
| `status` | VARCHAR(20) | DEFAULT 'draft', INDEXED | Product status (draft, active, archived) |
| `is_visible` | BOOLEAN | DEFAULT true | Visibility flag |
| `stock_quantity` | INTEGER | DEFAULT 0 | Denormalized stock quantity |
| `stock_status` | VARCHAR(20) | DEFAULT 'out_of_stock' | Stock status (in_stock, out_of_stock, backorder) |
| `weight` | DECIMAL(10,2) | NULLABLE | Weight in kg |
| `length` | DECIMAL(10,2) | NULLABLE | Length in cm |
| `width` | DECIMAL(10,2) | NULLABLE | Width in cm |
| `height` | DECIMAL(10,2) | NULLABLE | Height in cm |
| `meta_title` | VARCHAR(255) | NULLABLE | SEO meta title |
| `meta_description` | TEXT | NULLABLE | SEO meta description |
| `attributes` | JSONB | NULLABLE | Flexible product attributes |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |
| `published_at` | TIMESTAMP | NULLABLE | Publication timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `sku` (for SKU lookups)
- Unique Index: `slug` (for URL routing)
- Index: `name` (for search)
- Index: `price` (for price filtering)
- Index: `status` (for status filtering)
- Full-Text Index: `name, description` (for search)

**Production Considerations**:
- **Search**: Use PostgreSQL full-text search or Elasticsearch
- **Caching**: Cache popular products in Redis
- **Denormalization**: `stock_quantity` denormalized from inventory table

---

### 2. `categories` Table

**Purpose**: Product category hierarchy

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique category identifier |
| `name` | VARCHAR(255) | NOT NULL, INDEXED | Category name |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly identifier |
| `description` | TEXT | NULLABLE | Category description |
| `parent_id` | VARCHAR(25) | FOREIGN KEY → categories.id, NULLABLE | Parent category (for hierarchy) |
| `level` | INTEGER | DEFAULT 0 | Category depth level |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |
| `image_url` | VARCHAR(500) | NULLABLE | Category image URL |
| `is_active` | BOOLEAN | DEFAULT true, INDEXED | Active status |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `slug` (for URL routing)
- Index: `name` (for search)
- Index: `parent_id` (for hierarchy queries)
- Index: `is_active` (for filtering active categories)

**Foreign Keys**:
- `parent_id` → `categories.id` (SET NULL on delete)

**Hierarchy Example**:
```
Electronics (level 0)
  ├── Computers (level 1)
  │   ├── Laptops (level 2)
  │   └── Desktops (level 2)
  └── Phones (level 1)
      ├── Smartphones (level 2)
      └── Accessories (level 2)
```

---

### 3. `product_categories` Table

**Purpose**: Many-to-many relationship between products and categories

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique assignment identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id | Product identifier |
| `category_id` | VARCHAR(25) | FOREIGN KEY → categories.id | Category identifier |
| `created_at` | TIMESTAMP | DEFAULT now() | Assignment timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Constraint: `(product_id, category_id)` (prevents duplicates)
- Index: `product_id` (for product category queries)
- Index: `category_id` (for category product queries)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)
- `category_id` → `categories.id` (CASCADE DELETE)

---

### 4. `product_variants` Table

**Purpose**: Product variants (size, color, etc.)

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique variant identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, INDEXED | Parent product identifier |
| `sku` | VARCHAR(100) | UNIQUE, NOT NULL | Variant SKU |
| `name` | VARCHAR(255) | NULLABLE | Variant name |
| `price` | DECIMAL(10,2) | NULLABLE | Variant-specific price (overrides product price) |
| `compare_at_price` | DECIMAL(10,2) | NULLABLE | Variant compare price |
| `stock_quantity` | INTEGER | DEFAULT 0 | Variant stock quantity |
| `stock_status` | VARCHAR(20) | DEFAULT 'out_of_stock' | Variant stock status |
| `attributes` | JSONB | NULLABLE | Variant attributes (size, color, etc.) |
| `image_url` | VARCHAR(500) | NULLABLE | Variant-specific image |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `sku` (for SKU lookups)
- Index: `product_id` (for product variant queries)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)

**Attributes Example**:
```json
{
  "size": "Large",
  "color": "Blue",
  "material": "Cotton"
}
```

---

### 5. `product_images` Table

**Purpose**: Product images

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique image identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, INDEXED | Product identifier |
| `url` | VARCHAR(500) | NOT NULL | Image URL |
| `alt_text` | VARCHAR(255) | NULLABLE | Alt text for accessibility |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |
| `is_primary` | BOOLEAN | DEFAULT false | Primary image flag |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `product_id` (for product image queries)
- Composite Index: `(product_id, sort_order)` (for ordered queries)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)

**Business Rules**:
- Only one primary image per product
- Enforced at application level

---

### 6. `product_inventory` Table

**Purpose**: Inventory tracking (can be per product or per variant)

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique inventory record identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, UNIQUE (when variant_id is NULL) | Product identifier |
| `variant_id` | VARCHAR(25) | FOREIGN KEY → product_variants.id, NULLABLE | Variant identifier (nullable for product-level inventory) |
| `quantity` | INTEGER | DEFAULT 0 | Total quantity |
| `reserved_quantity` | INTEGER | DEFAULT 0 | Reserved quantity (for pending orders) |
| `available_quantity` | INTEGER | GENERATED AS (quantity - reserved_quantity) | Available quantity (computed) |
| `location` | VARCHAR(100) | NULLABLE | Warehouse/location identifier |
| `last_restocked_at` | TIMESTAMP | NULLABLE | Last restock timestamp |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Constraint: `(product_id, variant_id)` (one inventory record per product/variant)
- Index: `product_id` (for product inventory queries)
- Index: `variant_id` (for variant inventory queries)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)
- `variant_id` → `product_variants.id` (CASCADE DELETE)

**Business Rules**:
- If `variant_id` is NULL, inventory is at product level
- If `variant_id` is set, inventory is at variant level
- `available_quantity` = `quantity` - `reserved_quantity`

---

### 7. `product_reviews` Table

**Purpose**: Product reviews and ratings

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique review identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, INDEXED | Product identifier |
| `user_id` | VARCHAR(25) | NOT NULL, INDEXED | References auth-service `users.id` (no FK constraint) |
| `rating` | INTEGER | NOT NULL, INDEXED | Rating (1-5) |
| `title` | VARCHAR(255) | NULLABLE | Review title |
| `comment` | TEXT | NULLABLE | Review comment |
| `is_verified_purchase` | BOOLEAN | DEFAULT false | Verified purchase flag |
| `is_approved` | BOOLEAN | DEFAULT false, INDEXED | Approval status |
| `helpful_count` | INTEGER | DEFAULT 0 | Helpful votes count |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `product_id` (for product review queries)
- Index: `user_id` (for user review queries)
- Index: `rating` (for rating filtering)
- Index: `is_approved` (for filtering approved reviews)
- Index: `created_at` (for sorting by date)
- Composite Index: `(product_id, is_approved, rating)` (for product review queries)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)

**Cross-Service Reference**:
- `user_id` references `auth.users.id` (logical reference, no FK constraint)

**Business Rules**:
- One review per user per product
- Enforced at application level
- Reviews require approval before display

---

### 8. `product_tags` Table

**Purpose**: Product tags for flexible categorization

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique tag identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, INDEXED | Product identifier |
| `tag` | VARCHAR(100) | NOT NULL, INDEXED | Tag name |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `product_id` (for product tag queries)
- Index: `tag` (for tag-based queries)
- Composite Index: `(product_id, tag)` (for unique constraint check)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)

**Business Rules**:
- Multiple tags per product allowed
- Tags are case-insensitive (normalized at application level)

---

### 9. `product_questions` Table

**Purpose**: Product Q&A section - questions and answers

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique question identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, INDEXED | Product identifier |
| `user_id` | VARCHAR(25) | NULLABLE, INDEXED | User who asked (optional for guest questions) |
| `question` | TEXT | NOT NULL | Question text |
| `answer` | TEXT | NULLABLE | Answer text |
| `answered_by` | VARCHAR(25) | NULLABLE | User ID who answered (verified purchasers or admins) |
| `answered_at` | TIMESTAMP | NULLABLE | Answer timestamp |
| `upvotes` | INTEGER | DEFAULT 0 | Upvote count |
| `is_approved` | BOOLEAN | DEFAULT false, INDEXED | Approval status |
| `reported_count` | INTEGER | DEFAULT 0 | Report count |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `product_id` (for product Q&A queries)
- Index: `user_id` (for user Q&A queries)
- Index: `is_approved` (for filtering approved Q&A)
- Index: `created_at` (for sorting by date)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)

**Business Rules**:
- Questions can be asked by authenticated users or guests
- Answers can be provided by verified purchasers or admins
- Q&A requires approval before display

---

### 10. `stock_alerts` Table

**Purpose**: Stock alert subscriptions - notify users when product is back in stock

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique alert identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, INDEXED | Product identifier |
| `user_id` | VARCHAR(25) | NOT NULL, INDEXED | User who wants to be notified |
| `email` | VARCHAR(255) | NOT NULL | Email to notify |
| `variant_id` | VARCHAR(25) | NULLABLE | Specific variant if applicable |
| `notified` | BOOLEAN | DEFAULT false, INDEXED | Notification sent flag |
| `notified_at` | TIMESTAMP | NULLABLE | Notification timestamp |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `expires_at` | TIMESTAMP | NOT NULL, INDEXED | Alert expiration date |

**Indexes**:
- Primary Key: `id`
- Unique Constraint: `(user_id, product_id, variant_id)` (one alert per user/product/variant)
- Index: `product_id` (for product alert queries)
- Index: `user_id` (for user alert queries)
- Index: `notified` (for filtering sent alerts)
- Index: `expires_at` (for cleanup queries)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)

**Business Rules**:
- One alert per user per product/variant combination
- Alerts expire after a set period (e.g., 30 days)
- Email notification sent when product is back in stock

---

### 11. `recently_viewed_products` Table

**Purpose**: Track recently viewed products per user

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique view identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, INDEXED | Product identifier |
| `user_id` | VARCHAR(25) | NOT NULL, INDEXED | User who viewed |
| `viewed_at` | TIMESTAMP | DEFAULT now(), INDEXED | View timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Constraint: `(user_id, product_id)` (one record per user/product)
- Index: `user_id` (for user view queries)
- Index: `product_id` (for product view queries)
- Composite Index: `(user_id, viewed_at)` (for ordered queries)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)

**Business Rules**:
- One record per user per product (updated on re-view)
- Auto-cleanup old views (e.g., older than 90 days)

---

### 12. `product_comparisons` Table

**Purpose**: Product comparisons - compare up to 4 products side-by-side

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique comparison identifier |
| `user_id` | VARCHAR(25) | NOT NULL, INDEXED | User who created comparison |
| `name` | VARCHAR(255) | NULLABLE | Optional name for saved comparison |
| `product_ids` | TEXT[] | NOT NULL | Array of product IDs (max 4) |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `user_id` (for user comparison queries)
- Index: `created_at` (for sorting by date)

**Business Rules**:
- Maximum 4 products per comparison
- Product IDs stored as array
- Comparisons can be saved with optional name

---

### 13. `price_history` Table

**Purpose**: Track price changes over time

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique history record identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, INDEXED | Product identifier |
| `price` | DECIMAL(10,2) | NOT NULL | Price at this point |
| `compare_at_price` | DECIMAL(10,2) | NULLABLE | Compare price at this point |
| `changed_by` | VARCHAR(25) | NULLABLE | User ID or system |
| `reason` | VARCHAR(255) | NULLABLE | Reason for price change |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Change timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `product_id` (for product price history queries)
- Index: `created_at` (for sorting by date)
- Composite Index: `(product_id, created_at)` (for product history queries)

**Foreign Keys**:
- `product_id` → `products.id` (CASCADE DELETE)

**Business Rules**:
- Record created on every price change
- Historical data for price tracking and analytics

---

### 14. `product_search_history` Table

**Purpose**: Track search queries for analytics and recommendations

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique search record identifier |
| `product_id` | VARCHAR(25) | FOREIGN KEY → products.id, NULLABLE, INDEXED | Product clicked (if any) |
| `user_id` | VARCHAR(25) | NULLABLE, INDEXED | User who searched (optional for guest searches) |
| `query` | VARCHAR(500) | NOT NULL, INDEXED | Search query |
| `filters` | JSONB | NULLABLE | Applied filters |
| `results_count` | INTEGER | NULLABLE | Number of results |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Search timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `user_id` (for user search queries)
- Index: `query` (for query analytics)
- Index: `created_at` (for sorting by date)
- Composite Index: `(user_id, created_at)` (for user search history)

**Foreign Keys**:
- `product_id` → `products.id` (SET NULL on delete)

**Business Rules**:
- Track all search queries for analytics
- Optional product_id if user clicked on a result
- Filters stored as JSON for flexible filtering

---

## Enhanced Features Summary

The Product Service database now includes:

1. **Product Q&A** - Questions and answers with moderation
2. **Stock Alerts** - Notify users when products are back in stock
3. **Recently Viewed Products** - Track user product views
4. **Product Comparisons** - Compare up to 4 products side-by-side
5. **Price History** - Track price changes over time
6. **Search History** - Track search queries for analytics

Additionally, the `products` table includes:
- `badges` (String[]) - Product badges (new, sale, featured, bestseller, etc.)
- `view_count` (Integer) - Product view count
- `purchase_count` (Integer) - Product purchase count
- `search_count` (Integer) - Product search count
- Full-text search index on `name`, `description`, `short_description`

---

## Indexing Strategy

### Primary Indexes
- All primary keys (automatic)

### Performance Indexes
- `products.sku` - Unique index for SKU lookups
- `products.slug` - Unique index for URL routing
- `products.name` - Full-text search
- `products.price` - Price filtering
- `products.status` - Status filtering
- `categories.slug` - URL routing
- `categories.parent_id` - Hierarchy queries
- `product_reviews.product_id` - Product review queries
- `product_reviews.rating` - Rating filtering
- `product_tags.tag` - Tag-based queries

### Composite Indexes
- `product_categories(product_id, category_id)` - Unique constraint
- `product_reviews(product_id, is_approved, rating)` - Product review queries
- `product_images(product_id, sort_order)` - Ordered image queries

### Full-Text Search
- PostgreSQL `tsvector` on `products.name` and `products.description`
- Use `ts_rank` for relevance scoring

---

## Production Optimizations

### 1. Search Strategy

**PostgreSQL Full-Text Search**:
```sql
-- Create full-text search index
CREATE INDEX products_search_idx ON products 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Search query
SELECT *, ts_rank(search_vector, query) AS rank
FROM products, to_tsquery('english', 'laptop') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

**Alternative: Elasticsearch**:
- For advanced search features
- Better performance at scale
- Faceted search, autocomplete, etc.

### 2. Caching Strategy

**Redis Caching**:
- Popular products (TTL: 1 hour)
- Category trees (TTL: 24 hours)
- Product details by ID (TTL: 15 minutes)
- Product reviews (TTL: 30 minutes)

**Cache Invalidation**:
- Invalidate on product update
- Invalidate on category changes
- Invalidate on review approval

### 3. Inventory Management

**Stock Updates**:
- Use database transactions for stock updates
- Implement optimistic locking to prevent overselling
- Reserve inventory when order is created
- Release reservation if order cancelled

**Stock Synchronization**:
- Sync `products.stock_quantity` from `product_inventory`
- Update via database trigger or application logic
- Real-time updates via events

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
- Product catalog size
- Search query performance
- Inventory update latency
- Review approval queue size
- Cache hit rates

**Alerts**:
- Search query time > 500ms
- Low stock alerts (< 10 units)
- Review approval queue > 100
- Cache miss rate > 30%

---

## Security Considerations

### 1. Data Protection

- **PII**: User reviews contain user data (user_id)
- **Access Control**: Role-based access (RBAC) via auth-service
- **Content Moderation**: Review approval process

### 2. Inventory Security

- **Stock Manipulation**: Prevent unauthorized stock updates
- **Audit Logging**: Log all inventory changes
- **Concurrency Control**: Use transactions and locking

---

## Estimated Capacity

### Current Scale (Production)

- **Products**: 100,000
- **Categories**: 1,000
- **Product Variants**: 200,000
- **Product Images**: 500,000
- **Product Reviews**: 1,000,000
- **Product Tags**: 500,000

### Growth Projections

- **New Products**: 1,000/month
- **New Reviews**: 10,000/month
- **New Variants**: 2,000/month

### Storage Estimates

- **Database Size**: ~50 GB
- **Monthly Growth**: ~5 GB
- **Index Size**: ~10 GB

---

## Next Steps

- View [Order Service Database](./04-order-service-database.md)
- View [Cross-Service References](./08-cross-service-references.md)
- Return to [Database Architecture Overview](./README.md)

