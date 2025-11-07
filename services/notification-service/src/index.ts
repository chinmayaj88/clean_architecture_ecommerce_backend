/**
 * Notification Service Entry Point
 * Consumes events from SQS/SNS and sends notifications
 * TODO: Implement event consumers and notification senders
 */

import express from 'express';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3004;

// Helmet v8 requires explicit configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', service: 'notification-service' });
});

// TODO: Add SQS/SNS event consumers
// TODO: Add email/SMS/push notification senders

app.listen(PORT, () => {
  console.log(`Notification service started on port ${PORT}`);
});

export default app;

