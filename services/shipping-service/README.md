# Shipping Service

Shipping service for managing shipping rates, carriers, shipment tracking, and shipping zones.

## Features

- **Shipping Rate Calculation**: Calculate shipping costs based on zones, weight, and order amount
- **Carrier Integration**: Support for multiple carriers (FedEx, UPS, DHL, USPS) with adapter pattern
- **Shipment Tracking**: Create and track shipments with full tracking history
- **Shipping Zones**: Define geographic zones (country, state, postal code based)
- **Shipping Methods**: Configure shipping methods per zone with pricing rules
- **Event-Driven**: Consumes order events and publishes shipment events

## API Endpoints

### Public Endpoints

- `POST /api/v1/rates/calculate` - Calculate shipping rates
- `GET /api/v1/shipments/track/:trackingNumber` - Track shipment by tracking number
- `GET /api/v1/zones` - List shipping zones
- `GET /api/v1/zones/:id` - Get zone details
- `GET /api/v1/methods` - List shipping methods
- `GET /api/v1/methods/:id` - Get method details

### Authenticated Endpoints

- `POST /api/v1/shipments` - Create shipment
- `GET /api/v1/shipments/order/:orderId` - Get shipments for order
- `GET /api/v1/shipments/:id` - Get shipment details
- `GET /api/v1/shipments/:id/tracking` - Get tracking information
- `PUT /api/v1/shipments/:id/status` - Update shipment status

### Admin Endpoints

- `POST /api/v1/zones` - Create shipping zone
- `PUT /api/v1/zones/:id` - Update shipping zone
- `DELETE /api/v1/zones/:id` - Delete shipping zone
- `POST /api/v1/methods` - Create shipping method
- `PUT /api/v1/methods/:id` - Update shipping method
- `DELETE /api/v1/methods/:id` - Delete shipping method

## Event Consumption

### Consumes
- `order.created` - Create shipment for order
- `order.shipped` - Update shipment status
- `order.delivered` - Mark shipment as delivered

### Publishes
- `shipment.created` - Shipment created
- `shipment.status.changed` - Shipment status updated

## Database Schema

- `shipping_zones` - Geographic shipping zones
- `shipping_methods` - Shipping methods per zone
- `shipping_rates` - Rate tiers (weight/amount-based)
- `shipments` - Shipment records
- `shipment_tracking` - Tracking history
- `carriers` - Carrier configurations

## Environment Variables

See `.env.example` for all required environment variables.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Start service:
   ```bash
   npm run dev
   ```

## Development

- `npm run build` - Build TypeScript
- `npm run dev` - Start development server
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:migrate` - Run migrations

