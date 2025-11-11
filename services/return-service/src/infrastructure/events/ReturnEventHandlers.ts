import { UpdateReturnStatusUseCase } from '../../core/use-cases/UpdateReturnStatusUseCase';
import { IReturnRequestRepository } from '../../ports/interfaces/IReturnRequestRepository';
import { ReturnStatus } from '../../core/entities/ReturnRequest';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export interface OrderDeliveredEvent {
  orderId: string;
  userId: string;
  timestamp: string;
  source: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  userId: string;
  timestamp: string;
  source: string;
}

export interface RefundCompletedEvent {
  refundId: string;
  returnRequestId?: string;
  orderId: string;
  userId: string;
  timestamp: string;
  source: string;
}

export interface RefundFailedEvent {
  refundId: string;
  returnRequestId?: string;
  orderId: string;
  userId: string;
  timestamp: string;
  source: string;
}

export class ReturnEventHandlers {
  constructor(
    private readonly updateReturnStatusUseCase: UpdateReturnStatusUseCase,
    private readonly returnRequestRepository: IReturnRequestRepository
  ) {}

  async handleOrderDelivered(event: OrderDeliveredEvent): Promise<void> {
    try {
      logger.info('Handling order.delivered event', {
        orderId: event.orderId,
        userId: event.userId,
      });

      // Order delivered - returns can now be requested
      // This is informational, no action needed
      logger.debug('Order delivered - returns can now be requested', { orderId: event.orderId });
    } catch (error) {
      logger.error('Failed to handle order.delivered event', {
        orderId: event.orderId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    try {
      logger.info('Handling order.cancelled event', {
        orderId: event.orderId,
        userId: event.userId,
      });

      // Cancel any pending return requests for this order
      const returnRequests = await this.returnRequestRepository.findByOrderId(event.orderId);
      
      for (const returnRequest of returnRequests) {
        if (returnRequest.status === ReturnStatus.PENDING) {
          await this.updateReturnStatusUseCase.execute({
            returnRequestId: returnRequest.id,
            status: ReturnStatus.CLOSED,
            changedBy: 'system',
            notes: 'Order cancelled',
          });
          logger.info('Return request closed due to order cancellation', {
            returnRequestId: returnRequest.id,
            orderId: event.orderId,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to handle order.cancelled event', {
        orderId: event.orderId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async handleRefundCompleted(event: RefundCompletedEvent): Promise<void> {
    try {
      logger.info('Handling refund.completed event', {
        refundId: event.refundId,
        returnRequestId: event.returnRequestId,
      });

      if (event.returnRequestId) {
        const returnRequest = await this.returnRequestRepository.findById(event.returnRequestId);
        if (returnRequest && returnRequest.status === ReturnStatus.PROCESSED) {
          await this.updateReturnStatusUseCase.execute({
            returnRequestId: returnRequest.id,
            status: ReturnStatus.CLOSED,
            changedBy: 'system',
            notes: 'Refund completed',
          });
          logger.info('Return request closed after refund completion', {
            returnRequestId: returnRequest.id,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to handle refund.completed event', {
        refundId: event.refundId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async handleRefundFailed(event: RefundFailedEvent): Promise<void> {
    try {
      logger.info('Handling refund.failed event', {
        refundId: event.refundId,
        returnRequestId: event.returnRequestId,
      });

      // Log the failure - manual intervention may be required
      logger.warn('Refund failed - manual intervention may be required', {
        refundId: event.refundId,
        returnRequestId: event.returnRequestId,
      });
    } catch (error) {
      logger.error('Failed to handle refund.failed event', {
        refundId: event.refundId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

