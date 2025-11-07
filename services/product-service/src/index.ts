/**
 * Product Service Entry Point
 * TODO: Implement full service following auth-service pattern
 */

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy', service: 'product-service' });
});

app.listen(PORT, () => {
  console.log(`Product service started on port ${PORT}`);
});

export default app;

