# Notification Service Database Design

## Overview

**Database Name**: `notification_db`  
**Service**: Notification Service  
**Purpose**: Notification management, email templates, notification preferences  
**Technology**: PostgreSQL 15+  
**ORM**: Prisma

---

## ER Diagram

```mermaid
erDiagram
    NOTIFICATIONS ||--|| NOTIFICATION_LOGS : "has"
    EMAIL_TEMPLATES ||--o{ NOTIFICATIONS : "uses"
    NOTIFICATION_PREFERENCES ||--o{ NOTIFICATIONS : "controls"
    
    NOTIFICATIONS {
        string id PK "cuid()"
        string userId "References auth.users.id, indexed"
        string type "email|sms|push|in_app, indexed"
        string templateId FK "References email_templates.id"
        string subject
        text body
        string status "pending|sent|delivered|failed|bounced, indexed"
        json metadata
        datetime scheduledAt "Nullable"
        datetime sentAt "Nullable"
        datetime deliveredAt "Nullable"
        datetime createdAt "Indexed"
    }
    
    EMAIL_TEMPLATES {
        string id PK "cuid()"
        string name UK "Template name"
        string subject "Email subject"
        text bodyHtml "HTML body"
        text bodyText "Plain text body"
        json variables "Template variables"
        boolean isActive "Default: true"
        datetime createdAt
        datetime updatedAt
    }
    
    NOTIFICATION_PREFERENCES {
        string id PK "cuid()"
        string userId "References auth.users.id, indexed"
        string notificationType UK "email|sms|push|in_app"
        boolean emailEnabled "Default: true"
        boolean smsEnabled "Default: false"
        boolean pushEnabled "Default: true"
        datetime createdAt
        datetime updatedAt
        unique userId_notificationType "Composite unique"
    }
    
    NOTIFICATION_LOGS {
        string id PK "cuid()"
        string notificationId FK UK "References notifications.id"
        string status "sent|delivered|failed|bounced"
        string provider "sendgrid|twilio|aws-ses"
        string providerMessageId "Provider message ID"
        json providerResponse "Full provider response"
        text error "Nullable"
        datetime createdAt "Indexed"
    }
```

---

## Table Specifications

### 1. `notifications` Table

**Purpose**: Notification records (emails, SMS, push, in-app)

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique notification identifier |
| `user_id` | VARCHAR(25) | NOT NULL, INDEXED | References auth-service `users.id` (no FK constraint) |
| `type` | VARCHAR(20) | NOT NULL, INDEXED | Notification type (email, sms, push, in_app) |
| `template_id` | VARCHAR(25) | FOREIGN KEY → email_templates.id, NULLABLE | Email template identifier (for emails) |
| `subject` | VARCHAR(500) | NULLABLE | Notification subject (for emails) |
| `body` | TEXT | NOT NULL | Notification body/content |
| `status` | VARCHAR(20) | DEFAULT 'pending', INDEXED | Notification status (pending, sent, delivered, failed, bounced) |
| `metadata` | JSONB | NULLABLE | Additional notification data |
| `scheduled_at` | TIMESTAMP | NULLABLE | Scheduled send time |
| `sent_at` | TIMESTAMP | NULLABLE | Sent timestamp |
| `delivered_at` | TIMESTAMP | NULLABLE | Delivered timestamp |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `user_id` (for user notification queries)
- Index: `type` (for type filtering)
- Index: `status` (for status filtering)
- Index: `created_at` (for time-based queries)
- Composite Index: `(user_id, status, created_at)` (for user notification history)
- Composite Index: `(status, scheduled_at)` (for scheduled notifications)

**Cross-Service References**:
- `user_id` references `auth.users.id` (logical reference, no FK constraint)

**Foreign Keys**:
- `template_id` → `email_templates.id` (SET NULL on delete)

**Notification Status Flow**:
```
pending → sent → delivered
  ↓
failed
  ↓
bounced
```

**Production Considerations**:
- **Partitioning**: Partition by `created_at` month for large volumes
- **Archiving**: Archive delivered notifications after 90 days
- **Retry Logic**: Retry failed notifications with exponential backoff

---

### 2. `email_templates` Table

**Purpose**: Email template definitions

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique template identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Template name (e.g., 'welcome_email', 'order_confirmation') |
| `subject` | VARCHAR(500) | NOT NULL | Email subject template |
| `body_html` | TEXT | NOT NULL | HTML email body template |
| `body_text` | TEXT | NULLABLE | Plain text email body template |
| `variables` | JSONB | NULLABLE | Template variables schema |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `name` (for template lookup)

**Common Templates**:
- `welcome_email` - Welcome email for new users
- `email_verification` - Email verification
- `password_reset` - Password reset
- `order_confirmation` - Order confirmation
- `order_shipped` - Order shipped notification
- `order_delivered` - Order delivered notification
- `payment_receipt` - Payment receipt

**Template Variables Example**:
```json
{
  "userName": "string",
  "orderNumber": "string",
  "orderTotal": "decimal",
  "trackingNumber": "string",
  "resetLink": "url"
}
```

---

### 3. `notification_preferences` Table

**Purpose**: User notification preferences

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique preference identifier |
| `user_id` | VARCHAR(25) | NOT NULL, INDEXED | References auth-service `users.id` (no FK constraint) |
| `notification_type` | VARCHAR(100) | NOT NULL | Notification type (email, sms, push, in_app) |
| `email_enabled` | BOOLEAN | DEFAULT true | Email notifications enabled |
| `sms_enabled` | BOOLEAN | DEFAULT false | SMS notifications enabled |
| `push_enabled` | BOOLEAN | DEFAULT true | Push notifications enabled |
| `created_at` | TIMESTAMP | DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT now(), ON UPDATE now() | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Constraint: `(user_id, notification_type)` (one preference per type per user)
- Index: `user_id` (for user preference queries)

**Cross-Service References**:
- `user_id` references `auth.users.id` (logical reference, no FK constraint)

**Notification Types**:
- `order_confirmation` - Order confirmation emails
- `order_shipped` - Order shipped notifications
- `order_delivered` - Order delivered notifications
- `payment_receipt` - Payment receipt emails
- `marketing` - Marketing emails
- `newsletter` - Newsletter emails
- `security` - Security notifications (always enabled)

**Business Rules**:
- Security notifications cannot be disabled
- Marketing notifications opt-in by default (false)
- Transactional notifications enabled by default (true)

---

### 4. `notification_logs` Table

**Purpose**: Notification delivery logs and provider responses

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(25) | PRIMARY KEY, DEFAULT cuid() | Unique log identifier |
| `notification_id` | VARCHAR(25) | FOREIGN KEY → notifications.id, UNIQUE | Notification identifier (one log per notification) |
| `status` | VARCHAR(20) | NOT NULL | Delivery status (sent, delivered, failed, bounced) |
| `provider` | VARCHAR(50) | NOT NULL | Notification provider (sendgrid, twilio, aws-ses, etc.) |
| `provider_message_id` | VARCHAR(255) | NULLABLE | Provider message ID |
| `provider_response` | JSONB | NULLABLE | Full provider API response |
| `error` | TEXT | NULLABLE | Error message if delivery failed |
| `created_at` | TIMESTAMP | DEFAULT now(), INDEXED | Log creation timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Constraint: `notification_id` (one log per notification)
- Index: `created_at` (for time-based queries)
- Index: `status` (for status filtering)

**Foreign Keys**:
- `notification_id` → `notifications.id` (CASCADE DELETE)

**Purpose**:
- **Delivery Tracking**: Track notification delivery status
- **Debugging**: Full provider responses stored
- **Analytics**: Analyze delivery rates and failures

---

## Indexing Strategy

### Primary Indexes
- All primary keys (automatic)

### Performance Indexes
- `notifications.user_id` - User notification queries
- `notifications.type` - Type filtering
- `notifications.status` - Status filtering
- `notifications.created_at` - Time-based queries
- `email_templates.name` - Template lookup
- `notification_preferences.user_id` - User preference queries

### Composite Indexes
- `notifications(user_id, status, created_at)` - User notification history
- `notifications(status, scheduled_at)` - Scheduled notification processing
- `notification_preferences(user_id, notification_type)` - Unique constraint

---

## Production Optimizations

### 1. Notification Processing

**Queue Processing**:
```typescript
// Process pending notifications
async function processPendingNotifications() {
  const notifications = await notificationRepository.findPending({
    limit: 100,
    scheduledAt: { lte: new Date() }
  });
  
  for (const notification of notifications) {
    await sendNotification(notification);
  }
}
```

**Retry Logic**:
```typescript
// Retry failed notifications with exponential backoff
async function retryFailedNotification(notificationId: string) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      await sendNotification(notificationId);
      break;
    } catch (error) {
      retryCount++;
      await sleep(Math.pow(2, retryCount) * 1000);
    }
  }
}
```

### 2. Template Rendering

**Template Engine**:
```typescript
// Render email template
async function renderTemplate(
  templateName: string,
  variables: Record<string, any>
): Promise<{ subject: string; html: string; text: string }> {
  const template = await emailTemplateRepository.findByName(templateName);
  
  return {
    subject: renderString(template.subject, variables),
    html: renderString(template.bodyHtml, variables),
    text: renderString(template.bodyText, variables),
  };
}
```

### 3. Preference Checking

**Check User Preferences**:
```typescript
// Check if user wants this notification type
async function shouldSendNotification(
  userId: string,
  notificationType: string
): Promise<boolean> {
  const preference = await notificationPreferenceRepository.findByUserAndType(
    userId,
    notificationType
  );
  
  // Security notifications always enabled
  if (notificationType === 'security') {
    return true;
  }
  
  return preference?.emailEnabled ?? true; // Default enabled
}
```

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
- Notification send rate
- Delivery success rate
- Bounce rate
- Failed notification rate
- Template usage

**Alerts**:
- Delivery success rate < 95%
- Bounce rate > 5%
- Failed notification rate > 10%
- Queue size > 10,000

---

## Security Considerations

### 1. Data Protection

- **PII**: Notifications contain user email addresses and personal data
- **Access Control**: Users can only access their own notifications
- **Admin Access**: Admins can access all notifications via RBAC

### 2. Email Security

- **SPF/DKIM/DMARC**: Configure email authentication
- **Rate Limiting**: Limit email sending rate
- **Bounce Handling**: Handle bounces and unsubscribes

### 3. Template Security

- **XSS Prevention**: Sanitize template variables
- **Template Validation**: Validate template syntax
- **Access Control**: Limit template modification access

---

## Event Processing

### Consumed Events

**From Auth Service**:
- `user.created` - Send welcome email
- `email.verification.requested` - Send verification email
- `password.reset.requested` - Send password reset email

**From Order Service**:
- `order.created` - Send order confirmation
- `order.shipped` - Send shipping notification
- `order.delivered` - Send delivery notification

**From Payment Service**:
- `payment.succeeded` - Send payment receipt
- `payment.failed` - Send payment failure notification

**Event Handler**:
```typescript
// Handle order.created event
async function handleOrderCreatedEvent(event: OrderCreatedEvent) {
  // Check user preferences
  const shouldSend = await shouldSendNotification(
    event.userId,
    'order_confirmation'
  );
  
  if (!shouldSend) {
    return;
  }
  
  // Create notification
  await notificationRepository.create({
    userId: event.userId,
    type: 'email',
    templateId: 'order_confirmation',
    metadata: {
      orderId: event.orderId,
      orderNumber: event.orderNumber,
      totalAmount: event.totalAmount,
    },
  });
}
```

---

## Estimated Capacity

### Current Scale (Production)

- **Notifications**: 50,000,000
- **Email Templates**: 20
- **Notification Preferences**: 1,000,000
- **Notification Logs**: 50,000,000

### Growth Projections

- **New Notifications**: 500,000/month
- **New Preferences**: 10,000/month

### Storage Estimates

- **Database Size**: ~100 GB
- **Monthly Growth**: ~10 GB
- **Index Size**: ~20 GB

---

## Next Steps

- View [Cross-Service References](./08-cross-service-references.md)
- Return to [Database Architecture Overview](./README.md)

