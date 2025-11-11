# Notification Service

Notification service for sending emails, SMS, push notifications, and managing notification preferences.

## Overview

The Notification Service handles sending notifications (emails, SMS, push) to users based on events from other services. It consumes events from Auth Service, Order Service, and Payment Service to send appropriate notifications.

## Features

- ✅ **Email Notifications**: SendGrid, Nodemailer (SMTP), AWS SES
- ✅ **SMS Notifications**: Twilio
- ✅ **Push Notifications**: FCM, APNS (future)
- ✅ **Template Management**: Handlebars template rendering
- ✅ **User Preferences**: Per-user notification preferences
- ✅ **Event Consumption**: Consumes events from other services
- ✅ **Retry Logic**: Automatic retry for failed notifications
- ✅ **Delivery Logging**: Track notification delivery status

## API Endpoints

### Notifications
- `POST /api/v1/notifications` - Send notification
- `GET /api/v1/notifications/:id` - Get notification by ID
- `GET /api/v1/notifications/user/:userId` - Get notifications by user ID
- `POST /api/v1/notifications/:id/retry` - Retry failed notification

### Templates
- `POST /api/v1/templates` - Create email template
- `GET /api/v1/templates` - Get all templates
- `GET /api/v1/templates/:id` - Get template by ID
- `PUT /api/v1/templates/:id` - Update template
- `DELETE /api/v1/templates/:id` - Delete template

### Preferences
- `GET /api/v1/preferences?userId=xxx` - Get user preferences
- `GET /api/v1/preferences/:userId/:notificationType` - Get preference by type
- `POST /api/v1/preferences` - Create notification preference
- `PUT /api/v1/preferences` - Update user preferences

## Event Consumption

The service consumes the following events:

### From Auth Service:
- `user.created` - Send welcome email
- `email.verification.requested` - Send verification email
- `password.reset.requested` - Send password reset email

### From Order Service:
- `order.created` - Send order confirmation
- `order.shipped` - Send shipping notification
- `order.delivered` - Send delivery notification
- `order.cancelled` - Send cancellation notification

### From Payment Service:
- `payment.succeeded` - Send payment receipt
- `payment.failed` - Send payment failure notification
- `payment.refunded` - Send refund notification

## Database Schema

- `notifications` - Notification records
- `email_templates` - Email template definitions
- `notification_preferences` - User notification preferences
- `notification_logs` - Notification delivery logs

## Environment Variables

See `.env.example` for all available environment variables.

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string

### Optional Variables (with defaults)
- `NODE_ENV` - Environment (development, staging, production, test) - Default: development
- `PORT` - Server port - Default: 3007
- `EMAIL_PROVIDER` - Email provider (mock, sendgrid, nodemailer, aws-ses) - Default: mock
- `SMS_PROVIDER` - SMS provider (mock, twilio) - Default: mock
- `PUSH_PROVIDER` - Push provider (mock, fcm, apns) - Default: mock
- `EVENT_CONSUMER_TYPE` - Event consumer (mock, sqs) - Default: mock
- `EVENT_PUBLISHER_TYPE` - Event publisher (mock, sns) - Default: mock

### Provider-Specific Variables

**SendGrid:**
- `SENDGRID_API_KEY` - Required if using SendGrid

**SMTP (Nodemailer):**
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM_EMAIL` - Default sender email
- `SMTP_FROM_NAME` - Default sender name

**Twilio:**
- `TWILIO_ACCOUNT_SID` - Required if using Twilio
- `TWILIO_AUTH_TOKEN` - Required if using Twilio
- `TWILIO_PHONE_NUMBER` - Required if using Twilio

**AWS (SES/SQS/SNS):**
- `AWS_REGION` - AWS region - Default: us-east-1
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `SQS_QUEUE_URL` - SQS queue URL for consuming events
- `SNS_TOPIC_ARN` - SNS topic ARN for publishing events
- `AWS_SES_REGION` - AWS SES region (if using AWS SES for email)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

4. Run migrations:
   ```bash
   npm run prisma:migrate -- --name init
   ```

5. Start the service:
   ```bash
   npm run dev
   ```

## Development

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Build
npm run build

# Start
npm start

# Development mode
npm run dev
```

## Production

The service is production-ready with:
- ✅ Event consumption (SQS)
- ✅ Retry logic
- ✅ Error handling
- ✅ Health checks
- ✅ Logging
- ✅ Template rendering
- ✅ User preferences

## Integration

### Event Consumption

The service consumes events from:
- Auth Service (user events)
- Order Service (order events)
- Payment Service (payment events)

### Notification Providers

- **Email**: SendGrid, Nodemailer (SMTP), AWS SES, Mock
- **SMS**: Twilio, Mock
- **Push**: FCM, APNS, Mock (future)

## Testing

```bash
npm test
```

## License

MIT



