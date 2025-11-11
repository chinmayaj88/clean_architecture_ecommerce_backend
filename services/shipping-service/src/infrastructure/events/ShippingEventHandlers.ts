import { CreateShipmentUseCase } from '../../core/use-cases/CreateShipmentUseCase';
import { UpdateShipmentStatusUseCase } from '../../core/use-cases/UpdateShipmentStatusUseCase';
import { IShipmentRepository } from '../../ports/interfaces/IShipmentRepository';
import { IOrderServiceClient } from '../clients/OrderServiceClient';
import { ShipmentStatus, Address } from '../../core/entities/Shipment';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  shippingAddress?: Address;
  timestamp: string;
  source: string;
}

export interface OrderShippedEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  timestamp: string;
  source: string;
}

export interface OrderDeliveredEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  deliveredAt: string;
  timestamp: string;
  source: string;
}

export class ShippingEventHandlers {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly _createShipmentUseCase: CreateShipmentUseCase,
    private readonly updateShipmentStatusUseCase: UpdateShipmentStatusUseCase,
    private readonly shipmentRepository: IShipmentRepository,
    private readonly orderServiceClient: IOrderServiceClient
  ) {}

  /**
   * Handle order.created event
   * Automatically create shipment when order is created
   */
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      logger.info('Handling order.created event', {
        orderId: event.orderId,
        userId: event.userId,
      });

      // Check if shipment already exists
      const existingShipments = await this.shipmentRepository.findByOrderId(event.orderId);
      if (existingShipments.length > 0) {
        logger.info('Shipment already exists for order', { orderId: event.orderId });
        return;
      }

      // Get order details
      const order = await this.orderServiceClient.getOrder(event.orderId);
      if (!order) {
        logger.warn('Order not found when creating shipment', { orderId: event.orderId });
        return;
      }

      // For now, we'll need methodId from somewhere (could be in order metadata or default)
      // This is a simplified version - in production, you'd determine shipping method based on order
      logger.info('Order created event processed (shipment creation requires shipping method selection)', {
        orderId: event.orderId,
      });
    } catch (error) {
      logger.error('Failed to handle order.created event', {
        orderId: event.orderId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Handle order.shipped event
   * Update shipment status to in_transit
   */
  async handleOrderShipped(event: OrderShippedEvent): Promise<void> {
    try {
      logger.info('Handling order.shipped event', {
        orderId: event.orderId,
        userId: event.userId,
      });

      const shipments = await this.shipmentRepository.findByOrderId(event.orderId);
      
      for (const shipment of shipments) {
        if (shipment.status === ShipmentStatus.PENDING) {
          await this.updateShipmentStatusUseCase.execute({
            shipmentId: shipment.id,
            status: ShipmentStatus.IN_TRANSIT,
            description: 'Order shipped',
          });
          logger.info('Shipment status updated to in_transit', {
            shipmentId: shipment.id,
            orderId: event.orderId,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to handle order.shipped event', {
        orderId: event.orderId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Handle order.delivered event
   * Update shipment status to delivered
   */
  async handleOrderDelivered(event: OrderDeliveredEvent): Promise<void> {
    try {
      logger.info('Handling order.delivered event', {
        orderId: event.orderId,
        userId: event.userId,
      });

      const shipments = await this.shipmentRepository.findByOrderId(event.orderId);
      
      for (const shipment of shipments) {
        if (shipment.status !== ShipmentStatus.DELIVERED) {
          await this.updateShipmentStatusUseCase.execute({
            shipmentId: shipment.id,
            status: ShipmentStatus.DELIVERED,
            description: 'Order delivered',
          });
          logger.info('Shipment status updated to delivered', {
            shipmentId: shipment.id,
            orderId: event.orderId,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to handle order.delivered event', {
        orderId: event.orderId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}

