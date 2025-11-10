import { IEventConsumer, OrderCreatedEvent, OrderCancelledEvent } from '../../ports/interfaces/IEventConsumer';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export class MockEventConsumer implements IEventConsumer {
  private orderCreatedHandlers: Array<(event: OrderCreatedEvent) => Promise<void>> = [];
  private orderCancelledHandlers: Array<(event: OrderCancelledEvent) => Promise<void>> = [];
  private _isRunning = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  async start(): Promise<void> {
    this._isRunning = true;
    logger.info('Mock event consumer started (no-op in development)');
  }

  async stop(): Promise<void> {
    this._isRunning = false;
    logger.info('Mock event consumer stopped');
  }

  onOrderCreated(handler: (event: OrderCreatedEvent) => Promise<void>): void {
    this.orderCreatedHandlers.push(handler);
    logger.info('Order created handler registered');
  }

  onOrderCancelled(handler: (event: OrderCancelledEvent) => Promise<void>): void {
    this.orderCancelledHandlers.push(handler);
    logger.info('Order cancelled handler registered');
  }

  // Manual trigger for testing
  async triggerOrderCreated(event: OrderCreatedEvent): Promise<void> {
    logger.info('Triggering order.created event (mock)', { orderId: event.orderId });
    for (const handler of this.orderCreatedHandlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error('Error handling order.created event', { error });
      }
    }
  }

  async triggerOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    logger.info('Triggering order.cancelled event (mock)', { orderId: event.orderId });
    for (const handler of this.orderCancelledHandlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error('Error handling order.cancelled event', { error });
      }
    }
  }
}

