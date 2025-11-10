import { SendNotificationUseCase } from '../../core/use-cases/SendNotificationUseCase';
import { IEmailTemplateRepository } from '../../ports/interfaces/IEmailTemplateRepository';
import { TemplateRenderer } from '../template/TemplateRenderer';
import { NotificationType } from '../../core/entities/Notification';
import {
  UserCreatedEvent,
  EmailVerificationRequestedEvent,
  PasswordResetRequestedEvent,
  OrderCreatedEvent,
  OrderShippedEvent,
  OrderCancelledEvent,
  OrderDeliveredEvent,
  PaymentSucceededEvent,
  PaymentFailedEvent,
  PaymentRefundedEvent,
} from '../../ports/interfaces/IEventConsumer';
import { createLogger } from '../logging/logger';
import { UserServiceClient } from '../clients/UserServiceClient';
import { getEnvConfig } from '../../config/env';

const logger = createLogger();
const config = getEnvConfig();

export class NotificationEventHandlers {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly emailTemplateRepository: IEmailTemplateRepository,
    private readonly userServiceClient: UserServiceClient
  ) {}

  /**
   * Handle user.created event
   */
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    try {
      logger.info('Handling user.created event', { userId: event.userId });

      // Try to use email template
      const template = await this.emailTemplateRepository.findByName('welcome_email');
      
      if (template && template.isAvailable()) {
        const rendered = TemplateRenderer.render(template, {
          userId: event.userId,
          email: event.email,
          timestamp: event.timestamp,
        });

        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: rendered.subject,
          body: rendered.bodyHtml,
          bodyHtml: rendered.bodyHtml,
          bodyText: rendered.bodyText || undefined,
          metadata: {
            email: event.email,
            eventType: 'user.created',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'welcome',
        });
      } else {
        // Fallback to simple notification
        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: 'Welcome to Our Platform!',
          body: `Welcome! Thank you for joining us. Your account has been created successfully.`,
          metadata: {
            email: event.email,
            eventType: 'user.created',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'welcome',
        });
      }
    } catch (error) {
      logger.error('Failed to handle user.created event', {
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - log error and continue
    }
  }

  /**
   * Handle email.verification.requested event
   */
  async handleEmailVerificationRequested(event: EmailVerificationRequestedEvent): Promise<void> {
    try {
      logger.info('Handling email.verification.requested event', { userId: event.userId });

      const template = await this.emailTemplateRepository.findByName('email_verification');
      const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${event.verificationToken}`;

      if (template && template.isAvailable()) {
        const rendered = TemplateRenderer.render(template, {
          userId: event.userId,
          email: event.email,
          verificationToken: event.verificationToken,
          verificationUrl,
          expiresAt: event.expiresAt,
        });

        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: rendered.subject,
          body: rendered.bodyHtml,
          bodyHtml: rendered.bodyHtml,
          bodyText: rendered.bodyText || undefined,
          metadata: {
            email: event.email,
            verificationToken: event.verificationToken,
            expiresAt: event.expiresAt,
            eventType: 'email.verification.requested',
            source: event.source,
          },
          checkPreferences: false, // Always send verification emails
          notificationType: 'security',
        });
      } else {
        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: 'Verify Your Email Address',
          body: `Please verify your email address by clicking the following link: ${verificationUrl}`,
          metadata: {
            email: event.email,
            verificationToken: event.verificationToken,
            expiresAt: event.expiresAt,
            eventType: 'email.verification.requested',
            source: event.source,
          },
          checkPreferences: false,
          notificationType: 'security',
        });
      }
    } catch (error) {
      logger.error('Failed to handle email.verification.requested event', {
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw for security emails - they must be sent
      // Log error but rethrow so event can be retried
      throw error;
    }
  }

  /**
   * Handle password.reset.requested event
   */
  async handlePasswordResetRequested(event: PasswordResetRequestedEvent): Promise<void> {
    try {
      logger.info('Handling password.reset.requested event', { userId: event.userId });

      const template = await this.emailTemplateRepository.findByName('password_reset');
      const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${event.resetToken}`;

      if (template && template.isAvailable()) {
        const rendered = TemplateRenderer.render(template, {
          userId: event.userId,
          email: event.email,
          resetToken: event.resetToken,
          resetUrl,
          expiresAt: event.expiresAt,
        });

        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: rendered.subject,
          body: rendered.bodyHtml,
          bodyHtml: rendered.bodyHtml,
          bodyText: rendered.bodyText || undefined,
          metadata: {
            email: event.email,
            resetToken: event.resetToken,
            expiresAt: event.expiresAt,
            eventType: 'password.reset.requested',
            source: event.source,
          },
          checkPreferences: false, // Always send security emails
          notificationType: 'security',
        });
      } else {
        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: 'Reset Your Password',
          body: `You requested to reset your password. Click the following link: ${resetUrl}`,
          metadata: {
            email: event.email,
            resetToken: event.resetToken,
            expiresAt: event.expiresAt,
            eventType: 'password.reset.requested',
            source: event.source,
          },
          checkPreferences: false,
          notificationType: 'security',
        });
      }
    } catch (error) {
      logger.error('Failed to handle password.reset.requested event', {
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle order.created event
   */
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    try {
      logger.info('Handling order.created event', { orderId: event.orderId, userId: event.userId });

      // Fetch user email if not in event
      let userEmail: string | null = null;
      try {
        const userInfo = await this.userServiceClient.getUserById(event.userId);
        userEmail = userInfo?.email || null;
        if (!userEmail) {
          logger.warn('User email not found for order notification', {
            userId: event.userId,
            orderId: event.orderId,
          });
          // Continue - notification will fail gracefully if email is required
        }
      } catch (error) {
        logger.error('Failed to fetch user email for order notification', {
          userId: event.userId,
          orderId: event.orderId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue - we'll try to send anyway, it will fail gracefully
      }

      const template = await this.emailTemplateRepository.findByName('order_confirmation');

      if (template && template.isAvailable()) {
        const rendered = TemplateRenderer.render(template, {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          userId: event.userId,
          totalAmount: event.totalAmount,
          currency: event.currency,
          itemCount: event.itemCount,
          timestamp: event.timestamp,
        });

        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: rendered.subject,
          body: rendered.bodyHtml,
          bodyHtml: rendered.bodyHtml,
          bodyText: rendered.bodyText || undefined,
          metadata: {
            email: userEmail || undefined,
            orderId: event.orderId,
            orderNumber: event.orderNumber,
            totalAmount: event.totalAmount,
            currency: event.currency,
            itemCount: event.itemCount,
            eventType: 'order.created',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'orders',
        });
      } else {
        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: `Order Confirmation - ${event.orderNumber}`,
          body: `Thank you for your order! Order Number: ${event.orderNumber}, Total: ${event.currency} ${event.totalAmount}`,
          metadata: {
            email: userEmail || undefined,
            orderId: event.orderId,
            orderNumber: event.orderNumber,
            totalAmount: event.totalAmount,
            currency: event.currency,
            itemCount: event.itemCount,
            eventType: 'order.created',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'orders',
        });
      }
    } catch (error) {
      logger.error('Failed to handle order.created event', {
        orderId: event.orderId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - log error and continue processing other events
      // The notification will be marked as failed and can be retried
    }
  }

  /**
   * Handle order.shipped event
   */
  async handleOrderShipped(event: OrderShippedEvent): Promise<void> {
    try {
      logger.info('Handling order.shipped event', { orderId: event.orderId, userId: event.userId });

      // Fetch user email if not in event
      let userEmail: string | null = null;
      try {
        const userInfo = await this.userServiceClient.getUserById(event.userId);
        userEmail = userInfo?.email || null;
      } catch (error) {
        logger.error('Failed to fetch user email for shipping notification', {
          userId: event.userId,
          orderId: event.orderId,
        });
      }

      const template = await this.emailTemplateRepository.findByName('order_shipped');

      if (template && template.isAvailable()) {
        const rendered = TemplateRenderer.render(template, {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          userId: event.userId,
          trackingNumber: event.trackingNumber,
          shippingMethod: event.shippingMethod,
          timestamp: event.timestamp,
        });

        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: rendered.subject,
          body: rendered.bodyHtml,
          bodyHtml: rendered.bodyHtml,
          bodyText: rendered.bodyText || undefined,
          metadata: {
            email: userEmail || undefined,
            orderId: event.orderId,
            orderNumber: event.orderNumber,
            trackingNumber: event.trackingNumber,
            shippingMethod: event.shippingMethod,
            eventType: 'order.shipped',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'orders',
        });
      } else {
        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: `Your Order Has Shipped - ${event.orderNumber}`,
          body: `Your order ${event.orderNumber} has been shipped!${event.trackingNumber ? ` Tracking Number: ${event.trackingNumber}` : ''}`,
          metadata: {
            email: userEmail || undefined,
            orderId: event.orderId,
            orderNumber: event.orderNumber,
            trackingNumber: event.trackingNumber,
            shippingMethod: event.shippingMethod,
            eventType: 'order.shipped',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'orders',
        });
      }
    } catch (error) {
      logger.error('Failed to handle order.shipped event', {
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
   */
  async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
    try {
      logger.info('Handling order.cancelled event', { orderId: event.orderId, userId: event.userId });

      // Fetch user email if not in event
      let userEmail: string | null = null;
      try {
        const userInfo = await this.userServiceClient.getUserById(event.userId);
        userEmail = userInfo?.email || null;
      } catch (error) {
        logger.error('Failed to fetch user email for cancellation notification', {
          userId: event.userId,
          orderId: event.orderId,
        });
      }

      await this.sendNotificationUseCase.execute({
        userId: event.userId,
        type: NotificationType.EMAIL,
        subject: `Order Cancelled - ${event.orderNumber}`,
        body: `Your order ${event.orderNumber} has been cancelled.${event.reason ? ` Reason: ${event.reason}` : ''}`,
        metadata: {
          email: userEmail || undefined,
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          cancelledBy: event.cancelledBy,
          reason: event.reason,
          eventType: 'order.cancelled',
          source: event.source,
        },
        checkPreferences: true,
        notificationType: 'orders',
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

  /**
   * Handle payment.succeeded event
   */
  async handlePaymentSucceeded(event: PaymentSucceededEvent): Promise<void> {
    try {
      logger.info('Handling payment.succeeded event', { paymentId: event.paymentId, userId: event.userId });

      // Fetch user email if not in event
      let userEmail: string | null = null;
      try {
        const userInfo = await this.userServiceClient.getUserById(event.userId);
        userEmail = userInfo?.email || null;
      } catch (error) {
        logger.error('Failed to fetch user email for payment notification', {
          userId: event.userId,
          paymentId: event.paymentId,
        });
      }

      const template = await this.emailTemplateRepository.findByName('payment_receipt');

      if (template && template.isAvailable()) {
        const rendered = TemplateRenderer.render(template, {
          paymentId: event.paymentId,
          orderId: event.orderId,
          userId: event.userId,
          amount: event.amount,
          currency: event.currency,
          timestamp: event.timestamp,
        });

        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: rendered.subject,
          body: rendered.bodyHtml,
          bodyHtml: rendered.bodyHtml,
          bodyText: rendered.bodyText || undefined,
          metadata: {
            email: userEmail || undefined,
            paymentId: event.paymentId,
            orderId: event.orderId,
            amount: event.amount,
            currency: event.currency,
            eventType: 'payment.succeeded',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'orders',
        });
      } else {
        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: 'Payment Receipt',
          body: `Your payment of ${event.currency} ${event.amount} has been processed successfully.`,
          metadata: {
            email: userEmail || undefined,
            paymentId: event.paymentId,
            orderId: event.orderId,
            amount: event.amount,
            currency: event.currency,
            eventType: 'payment.succeeded',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'orders',
        });
      }
    } catch (error) {
      logger.error('Failed to handle payment.succeeded event', {
        paymentId: event.paymentId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - log error and continue
    }
  }

  /**
   * Handle payment.failed event
   */
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    try {
      logger.info('Handling payment.failed event', { paymentId: event.paymentId, userId: event.userId });

      // Fetch user email if not in event
      let userEmail: string | null = null;
      try {
        const userInfo = await this.userServiceClient.getUserById(event.userId);
        userEmail = userInfo?.email || null;
      } catch (error) {
        logger.error('Failed to fetch user email for payment failure notification', {
          userId: event.userId,
          paymentId: event.paymentId,
        });
      }

      await this.sendNotificationUseCase.execute({
        userId: event.userId,
        type: NotificationType.EMAIL,
        subject: 'Payment Failed',
        body: `Your payment of ${event.currency} ${event.amount} could not be processed. Error: ${event.error}`,
        metadata: {
          email: userEmail || undefined,
          paymentId: event.paymentId,
          amount: event.amount,
          currency: event.currency,
          error: event.error,
          eventType: 'payment.failed',
          source: event.source,
        },
        checkPreferences: true,
        notificationType: 'orders',
      });
    } catch (error) {
      logger.error('Failed to handle payment.failed event', {
        paymentId: event.paymentId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - log error and continue
    }
  }

  /**
   * Handle payment.refunded event
   */
  async handlePaymentRefunded(event: PaymentRefundedEvent): Promise<void> {
    try {
      logger.info('Handling payment.refunded event', { paymentId: event.paymentId, userId: event.userId });

      // Fetch user email if not in event
      let userEmail: string | null = null;
      try {
        const userInfo = await this.userServiceClient.getUserById(event.userId);
        userEmail = userInfo?.email || null;
      } catch (error) {
        logger.error('Failed to fetch user email for refund notification', {
          userId: event.userId,
          paymentId: event.paymentId,
        });
      }

      await this.sendNotificationUseCase.execute({
        userId: event.userId,
        type: NotificationType.EMAIL,
        subject: 'Payment Refunded',
        body: `Your refund of ${event.currency} ${event.amount} has been processed.${event.reason ? ` Reason: ${event.reason}` : ''}`,
        metadata: {
          email: userEmail || undefined,
          paymentId: event.paymentId,
          refundId: event.refundId,
          orderId: event.orderId,
          amount: event.amount,
          currency: event.currency,
          reason: event.reason,
          eventType: 'payment.refunded',
          source: event.source,
        },
        checkPreferences: true,
        notificationType: 'orders',
      });
    } catch (error) {
      logger.error('Failed to handle payment.refunded event', {
        paymentId: event.paymentId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - log error and continue
    }
  }

  /**
   * Handle order.delivered event
   */
  async handleOrderDelivered(event: OrderDeliveredEvent): Promise<void> {
    try {
      logger.info('Handling order.delivered event', { orderId: event.orderId, userId: event.userId });

      // Fetch user email if not in event
      let userEmail: string | null = null;
      try {
        const userInfo = await this.userServiceClient.getUserById(event.userId);
        userEmail = userInfo?.email || null;
      } catch (error) {
        logger.error('Failed to fetch user email for delivery notification', {
          userId: event.userId,
          orderId: event.orderId,
        });
      }

      const template = await this.emailTemplateRepository.findByName('order_delivered');

      if (template && template.isAvailable()) {
        const rendered = TemplateRenderer.render(template, {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          userId: event.userId,
          deliveredAt: event.deliveredAt,
          trackingNumber: event.trackingNumber,
          timestamp: event.timestamp,
        });

        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: rendered.subject,
          body: rendered.bodyHtml,
          bodyHtml: rendered.bodyHtml,
          bodyText: rendered.bodyText || undefined,
          metadata: {
            email: userEmail || undefined,
            orderId: event.orderId,
            orderNumber: event.orderNumber,
            deliveredAt: event.deliveredAt,
            trackingNumber: event.trackingNumber,
            eventType: 'order.delivered',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'orders',
        });
      } else {
        await this.sendNotificationUseCase.execute({
          userId: event.userId,
          type: NotificationType.EMAIL,
          subject: `Your Order Has Been Delivered - ${event.orderNumber}`,
          body: `Your order ${event.orderNumber} has been delivered!${event.trackingNumber ? ` Tracking Number: ${event.trackingNumber}` : ''} Thank you for your purchase!`,
          metadata: {
            email: userEmail || undefined,
            orderId: event.orderId,
            orderNumber: event.orderNumber,
            deliveredAt: event.deliveredAt,
            trackingNumber: event.trackingNumber,
            eventType: 'order.delivered',
            source: event.source,
          },
          checkPreferences: true,
          notificationType: 'orders',
        });
      }
    } catch (error) {
      logger.error('Failed to handle order.delivered event', {
        orderId: event.orderId,
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - log error and continue
    }
  }
}

