/**
 * Gateway Service Entry Point
 * Routes requests to appropriate microservices
 * TODO: Implement full service with request routing, auth validation, rate limiting
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', service: 'gateway-service' });
});

// TODO: Add proxy routes for auth-service, user-service, product-service

app.listen(PORT, () => {
  console.log(`Gateway service started on port ${PORT}`);
});

export default app;

