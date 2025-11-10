import { INotificationRepository } from '../../ports/interfaces/INotificationRepository';
import { SendNotificationUseCase, SendNotificationInput } from '../../core/use-cases/SendNotificationUseCase';
import { NotificationStatus, NotificationType } from '../../core/entities/Notification';
import { createLogger } from '../logging/logger';
import { getEnvConfig } from '../../config/env';

const logger = createLogger();
const config = getEnvConfig();

export class ScheduledNotificationProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private readonly PROCESS_INTERVAL_MS = 60000; // Process every minute
  private readonly BATCH_SIZE = config.MAX_NOTIFICATIONS_PER_BATCH || 100;

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  /**
   * Start processing scheduled notifications
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('Scheduled notification processor is already running');
      return;
    }

    logger.info('Starting scheduled notification processor', {
      intervalMs: this.PROCESS_INTERVAL_MS,
      batchSize: this.BATCH_SIZE,
    });

    // Process immediately on start
    this.processScheduledNotifications().catch((error) => {
      logger.error('Error in initial scheduled notification processing', { error });
    });

    // Then process on interval
    this.intervalId = setInterval(() => {
      this.processScheduledNotifications().catch((error) => {
        logger.error('Error in scheduled notification processing', { error });
      });
    }, this.PROCESS_INTERVAL_MS);
  }

  /**
   * Stop processing scheduled notifications
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Scheduled notification processor stopped');
    }
  }

  /**
   * Process scheduled notifications that are due
   */
  private async processScheduledNotifications(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('Scheduled notification processing already in progress, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      const pendingNotifications = await this.notificationRepository.findPending({
        limit: this.BATCH_SIZE,
        scheduledBefore: now,
      });

      if (pendingNotifications.length === 0) {
        logger.debug('No scheduled notifications to process');
        return;
      }

      logger.info('Processing scheduled notifications', {
        count: pendingNotifications.length,
      });

      // Process notifications in parallel (with concurrency limit)
      const concurrency = 10;
      for (let i = 0; i < pendingNotifications.length; i += concurrency) {
        const batch = pendingNotifications.slice(i, i + concurrency);
        await Promise.allSettled(
          batch.map((notification) => this.processNotification(notification))
        );
      }

      logger.info('Completed processing scheduled notifications', {
        count: pendingNotifications.length,
      });
    } catch (error) {
      logger.error('Error processing scheduled notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single scheduled notification
   */
  private async processNotification(notification: any): Promise<void> {
    try {
      // Check if notification should be sent now
      if (!notification.shouldSendNow()) {
        return;
      }

      logger.debug('Processing scheduled notification', {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
        scheduledAt: notification.scheduledAt,
      });

      // Prepare input for sending
      const input: SendNotificationInput = {
        userId: notification.userId,
        type: notification.type as NotificationType,
        subject: notification.subject || undefined,
        body: notification.body,
        metadata: notification.metadata || undefined,
        checkPreferences: true,
      };

      // Send the notification
      await this.sendNotificationUseCase.execute(input);

      logger.info('Scheduled notification sent successfully', {
        notificationId: notification.id,
      });
    } catch (error) {
      logger.error('Failed to process scheduled notification', {
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - notification will be retried on next run if still pending
    }
  }

  /**
   * Manually trigger processing (useful for testing or manual runs)
   */
  async processNow(): Promise<void> {
    await this.processScheduledNotifications();
  }
}

