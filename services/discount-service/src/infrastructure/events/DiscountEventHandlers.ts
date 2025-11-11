import { ApplyCouponUseCase } from '../../core/use-cases/ApplyCouponUseCase';
import { ApplyPromotionUseCase } from '../../core/use-cases/ApplyPromotionUseCase';
import { ICouponUsageRepository } from '../../ports/interfaces/ICouponUsageRepository';
import { IPromotionUsageRepository } from '../../ports/interfaces/IPromotionUsageRepository';
import { IOrderServiceClient } from '../clients/OrderServiceClient';
import { createLogger } from '../logging/logger';

const logger = createLogger();

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  couponCode?: string | null;
  promotionIds?: string[];
  timestamp: string;
  source: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  timestamp: string;
  source: string;
}

export class DiscountEventHandlers {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly _applyCouponUseCase: ApplyCouponUseCase,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly _applyPromotionUseCase: ApplyPromotionUseCase,
    private readonly couponUsageRepository: ICouponUsageRepository,
    private readonly promotionUsageRepository: IPromotionUsageRepository,
    private readonly orderServiceClient: IOrderServiceClient
  ) {}

  /**
   * Handle order.created event
   * Track coupon and promotion usage when an order is created
   */
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      logger.info('Handling order.created event', {
        orderId: event.orderId,
        userId: event.userId,
        couponCode: event.couponCode,
        promotionIds: event.promotionIds,
      });

      // If coupon was used, ensure usage is tracked
      if (event.couponCode) {
        const existingUsage = await this.couponUsageRepository.findByOrderId(event.orderId);
        if (!existingUsage) {
          // Coupon usage should have been created during checkout, but if not, log it
          logger.warn('Coupon usage not found for order', {
            orderId: event.orderId,
            couponCode: event.couponCode,
          });
        }
      }

      // If promotions were used, ensure usage is tracked
      if (event.promotionIds && event.promotionIds.length > 0) {
        const existingUsages = await this.promotionUsageRepository.findByOrderId(event.orderId);
        if (existingUsages.length !== event.promotionIds.length) {
          logger.warn('Promotion usage count mismatch', {
            orderId: event.orderId,
            expected: event.promotionIds.length,
            found: existingUsages.length,
          });
        }
      }

      logger.info('Order created event processed successfully', {
        orderId: event.orderId,
      });
    } catch (error) {
      logger.error('Failed to handle order.created event', {
        orderId: event.orderId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - log error and continue
    }
  }

  /**
   * Handle order.cancelled event
   * Reverse coupon and promotion usage when an order is cancelled
   */
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    try {
      logger.info('Handling order.cancelled event', {
        orderId: event.orderId,
        userId: event.userId,
      });

      // Get order details to find coupon and promotions
      const order = await this.orderServiceClient.getOrderByNumber(event.orderNumber);

      if (!order) {
        logger.warn('Order not found when processing cancellation', {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
        });
        return;
      }

      // Find and mark coupon usage as reversed (if needed)
      // Note: In a production system, you might want to create a "reversed" record
      // or update the existing usage record. For now, we'll just log it.
      if (order.couponCode) {
        const couponUsage = await this.couponUsageRepository.findByOrderId(event.orderId);
        if (couponUsage) {
          logger.info('Coupon usage found for cancelled order', {
            orderId: event.orderId,
            couponUsageId: couponUsage.id,
            discountAmount: couponUsage.discountAmount,
          });
          // In production, you might want to:
          // 1. Create a reversal record
          // 2. Decrement coupon usage count
          // 3. Update coupon usage status
        }
      }

      // Find and mark promotion usage as reversed
      const promotionUsages = await this.promotionUsageRepository.findByOrderId(event.orderId);
      if (promotionUsages.length > 0) {
        logger.info('Promotion usages found for cancelled order', {
          orderId: event.orderId,
          count: promotionUsages.length,
        });
        // In production, you might want to:
        // 1. Create reversal records
        // 2. Update promotion usage status
      }

      logger.info('Order cancelled event processed successfully', {
        orderId: event.orderId,
      });
    } catch (error) {
      logger.error('Failed to handle order.cancelled event', {
        orderId: event.orderId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - log error and continue
    }
  }
}

