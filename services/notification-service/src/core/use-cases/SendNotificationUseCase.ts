import { PrismaClient } from '@prisma/client';
import { INotificationRepository } from '../../ports/interfaces/INotificationRepository';
import { INotificationLogRepository } from '../../ports/interfaces/INotificationLogRepository';
import { INotificationPreferenceRepository } from '../../ports/interfaces/INotificationPreferenceRepository';
import { INotificationProvider } from '../../ports/interfaces/INotificationProvider';
import { Notification, NotificationType, NotificationStatus } from '../../core/entities/Notification';
import { NotificationLogStatus } from '../../core/entities/NotificationLog';
import { createLogger } from '../../infrastructure/logging/logger';

const logger = createLogger();

export interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  subject?: string;
  body: string;
  bodyHtml?: string;
  bodyText?: string;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
  checkPreferences?: boolean; // Check user preferences before sending
  notificationType?: string; // For preference checking (e.g., 'order_confirmation', 'payment_receipt')
}

export class SendNotificationUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly notificationRepository: INotificationRepository,
    private readonly notificationLogRepository: INotificationLogRepository,
    private readonly notificationPreferenceRepository: INotificationPreferenceRepository,
    private readonly notificationProvider: INotificationProvider
  ) {}

  async execute(input: SendNotificationInput): Promise<Notification> {
    // 1. Check user preferences if requested
    if (input.checkPreferences && input.notificationType) {
      const shouldSend = await this.shouldSendNotification(input.userId, input.notificationType, input.type);
      if (!shouldSend) {
        logger.info('Notification skipped due to user preferences', {
          userId: input.userId,
          notificationType: input.notificationType,
          type: input.type,
        });
        // Still create notification record but mark as skipped
        return this.notificationRepository.create({
          userId: input.userId,
          type: input.type,
          subject: input.subject || null,
          body: input.body,
          metadata: input.metadata || null,
          scheduledAt: input.scheduledAt || null,
          status: NotificationStatus.PENDING,
        });
      }
    }

    // 2. Create notification record
    const notification = await this.notificationRepository.create({
      userId: input.userId,
      type: input.type,
      subject: input.subject || null,
      body: input.bodyHtml || input.body,
      metadata: input.metadata || null,
      scheduledAt: input.scheduledAt || null,
      status: NotificationStatus.PENDING,
    });

    // 3. Send notification immediately if not scheduled
    if (!input.scheduledAt || input.scheduledAt <= new Date()) {
      await this.sendNotification(notification, input);
    }

    return notification;
  }

  private async shouldSendNotification(userId: string, notificationType: string, channel: NotificationType): Promise<boolean> {
    try {
      const preference = await this.notificationPreferenceRepository.findByUserAndType(userId, notificationType);

      if (!preference) {
        // Use default preferences
        const defaultPreference = this.notificationPreferenceRepository.getDefaultPreference(notificationType);
        return defaultPreference.isChannelEnabled(channel.toLowerCase() as 'email' | 'sms' | 'push');
      }

      // Security notifications cannot be disabled
      if (notificationType === 'security') {
        return true;
      }

      return preference.isChannelEnabled(channel.toLowerCase() as 'email' | 'sms' | 'push');
    } catch (error) {
      logger.error('Failed to check notification preferences', {
        userId,
        notificationType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Default to allowing notifications if preference check fails
      return true;
    }
  }

  private async sendNotification(notification: Notification, input: SendNotificationInput): Promise<void> {
    try {
      let response;

      // Send based on notification type
      switch (notification.type) {
        case NotificationType.EMAIL:
          // Get user email from metadata or user service
          const userEmail = input.metadata?.email || input.metadata?.userEmail;
          if (!userEmail) {
            logger.warn('User email not provided for email notification', {
              userId: notification.userId,
              notificationId: notification.id,
            });
            throw new Error('User email is required for email notifications');
          }

          response = await this.notificationProvider.sendEmail({
            to: userEmail,
            subject: input.subject || 'Notification',
            bodyHtml: input.bodyHtml || input.body,
            bodyText: input.bodyText,
            metadata: input.metadata,
          });
          break;

        case NotificationType.SMS:
          const userPhone = input.metadata?.phone || input.metadata?.userPhone;
          if (!userPhone) {
            throw new Error('User phone number is required for SMS notifications');
          }

          response = await this.notificationProvider.sendSms({
            to: userPhone,
            message: input.body,
            metadata: input.metadata,
          });
          break;

        case NotificationType.PUSH:
          response = await this.notificationProvider.sendPush({
            userId: notification.userId,
            title: input.subject || 'Notification',
            body: input.body,
            data: input.metadata,
          });
          break;

        case NotificationType.IN_APP:
          // In-app notifications are just stored, no external provider needed
          await this.notificationRepository.updateStatus(notification.id, NotificationStatus.SENT, new Date());
          return;

        default:
          throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      // Update notification status and create log
      await this.prisma.$transaction(async () => {
        if (response.success) {
          await this.notificationRepository.updateStatus(notification.id, NotificationStatus.SENT, new Date());
          await this.notificationLogRepository.create({
            notificationId: notification.id,
            status: NotificationLogStatus.SENT,
            provider: this.notificationProvider.getName(),
            providerMessageId: response.messageId || null,
            providerResponse: response.providerResponse || null,
          });
        } else {
          await this.notificationRepository.updateStatus(notification.id, NotificationStatus.FAILED);
          await this.notificationLogRepository.create({
            notificationId: notification.id,
            status: NotificationLogStatus.FAILED,
            provider: this.notificationProvider.getName(),
            error: response.error || 'Unknown error',
            providerResponse: response.providerResponse || null,
          });
        }
      });

      logger.info('Notification sent', {
        notificationId: notification.id,
        type: notification.type,
        userId: notification.userId,
        success: response.success,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('Failed to send notification', {
        notificationId: notification.id,
        type: notification.type,
        userId: notification.userId,
        error: errorMessage,
        stack: errorStack,
      });

      // Update notification status to failed
      try {
        await this.prisma.$transaction(async () => {
          await this.notificationRepository.updateStatus(notification.id, NotificationStatus.FAILED);
          await this.notificationLogRepository.create({
            notificationId: notification.id,
            status: NotificationLogStatus.FAILED,
            provider: this.notificationProvider.getName(),
            error: errorMessage,
          });
        });
      } catch (updateError) {
        logger.error('Failed to update notification status to failed', {
          notificationId: notification.id,
          error: updateError instanceof Error ? updateError.message : 'Unknown error',
        });
      }
    }
  }

  async retryFailedNotification(notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (!notification.canBeRetried()) {
      throw new Error('Notification cannot be retried');
    }

    // Reset status to pending and retry
    await this.notificationRepository.updateStatus(notificationId, NotificationStatus.PENDING);
    const updatedNotification = await this.notificationRepository.findById(notificationId);
    if (!updatedNotification) {
      throw new Error('Notification not found after update');
    }

    // Retry sending
    await this.sendNotification(updatedNotification, {
      userId: updatedNotification.userId,
      type: updatedNotification.type,
      subject: updatedNotification.subject || undefined,
      body: updatedNotification.body,
      metadata: updatedNotification.metadata || undefined,
    });

    return updatedNotification;
  }
}

