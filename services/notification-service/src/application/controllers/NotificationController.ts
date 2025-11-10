import { Response } from 'express';
import { SendNotificationUseCase, SendNotificationInput } from '../../core/use-cases/SendNotificationUseCase';
import { INotificationRepository } from '../../ports/interfaces/INotificationRepository';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { NotificationType } from '../../core/entities/Notification';

export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly notificationRepository: INotificationRepository
  ) {}

  /**
   * Send a notification
   * POST /api/v1/notifications
   */
  async sendNotification(req: RequestWithId, res: Response): Promise<void> {
    try {
      const input: SendNotificationInput = {
        userId: req.body.userId,
        type: req.body.type as NotificationType,
        subject: req.body.subject,
        body: req.body.body,
        bodyHtml: req.body.bodyHtml,
        bodyText: req.body.bodyText,
        metadata: req.body.metadata,
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
        checkPreferences: req.body.checkPreferences ?? true,
        notificationType: req.body.notificationType,
      };

      if (!input.userId) {
        throw new AppError(400, 'userId is required');
      }

      if (!input.type) {
        throw new AppError(400, 'type is required');
      }

      if (!input.body) {
        throw new AppError(400, 'body is required');
      }

      const notification = await this.sendNotificationUseCase.execute(input);
      sendCreated(res, 'Notification sent successfully', notification);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(400, error instanceof Error ? error.message : 'Failed to send notification');
    }
  }

  /**
   * Get notification by ID
   * GET /api/v1/notifications/:id
   */
  async getNotification(req: RequestWithId, res: Response): Promise<void> {
    try {
      const notificationId = req.params.id;
      const notification = await this.notificationRepository.findById(notificationId);

      if (!notification) {
        throw new AppError(404, 'Notification not found');
      }

      sendSuccess(res, 'Notification retrieved successfully', notification);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get notification');
    }
  }

  /**
   * Get notifications by user ID
   * GET /api/v1/notifications/user/:userId
   */
  async getNotificationsByUserId(req: RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const type = req.query.type as NotificationType | undefined;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const notifications = await this.notificationRepository.findByUserId(userId, {
        type,
        status: status as any,
        limit,
        offset,
      });

      sendSuccess(res, 'Notifications retrieved successfully', notifications);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get notifications');
    }
  }

  /**
   * Retry a failed notification
   * POST /api/v1/notifications/:id/retry
   */
  async retryNotification(req: RequestWithId, res: Response): Promise<void> {
    try {
      const notificationId = req.params.id;
      const notification = await this.sendNotificationUseCase.retryFailedNotification(notificationId);

      sendSuccess(res, 'Notification retry initiated successfully', notification);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Notification not found') {
        throw new AppError(404, error.message);
      }
      if (error instanceof Error && error.message === 'Notification cannot be retried') {
        throw new AppError(400, error.message);
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to retry notification');
    }
  }
}

