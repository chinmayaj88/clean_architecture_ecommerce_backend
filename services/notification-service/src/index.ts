/**
 * Notification Service Entry Point
 * Consumes events from SQS/SNS and sends notifications
 * TODO: Implement event consumers and notification senders
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3004;

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

