import { Response } from 'express';
import { INotificationPreferenceRepository } from '../../ports/interfaces/INotificationPreferenceRepository';
import { RequestWithId } from '../../middleware/requestId.middleware';
import { AppError } from '../../middleware/errorHandler.middleware';
import { sendSuccess, sendCreated } from '../utils/response.util';

export class NotificationPreferenceController {
  constructor(
    private readonly notificationPreferenceRepository: INotificationPreferenceRepository
  ) {}

  /**
   * Get user notification preferences
   * GET /api/v1/preferences?userId=xxx
   */
  async getPreferences(req: RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        throw new AppError(400, 'userId query parameter is required');
      }

      const preferences = await this.notificationPreferenceRepository.findByUserId(userId);
      sendSuccess(res, 'Preferences retrieved successfully', preferences);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get preferences');
    }
  }

  /**
   * Get user notification preference by type
   * GET /api/v1/preferences/:userId/:notificationType
   */
  async getPreference(req: RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const notificationType = req.params.notificationType;

      const preference = await this.notificationPreferenceRepository.findByUserAndType(
        userId,
        notificationType
      );

      if (!preference) {
        // Return default preference if not found
        const defaultPreference = this.notificationPreferenceRepository.getDefaultPreference(notificationType);
        sendSuccess(res, 'Preference retrieved successfully (default)', defaultPreference);
        return;
      }

      sendSuccess(res, 'Preference retrieved successfully', preference);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to get preference');
    }
  }

  /**
   * Update user notification preferences
   * PUT /api/v1/preferences
   */
  async updatePreferences(req: RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.body.userId;
      const notificationType = req.body.notificationType;

      if (!userId) {
        throw new AppError(400, 'userId is required');
      }

      if (!notificationType) {
        throw new AppError(400, 'notificationType is required');
      }

      // Check if preference exists
      let preference = await this.notificationPreferenceRepository.findByUserAndType(
        userId,
        notificationType
      );

      // Security notifications cannot be disabled
      if (notificationType === 'security') {
        throw new AppError(400, 'Security notification preferences cannot be modified');
      }

      // If preference doesn't exist, create it
      if (!preference) {
        preference = await this.notificationPreferenceRepository.create({
          userId,
          notificationType,
          emailEnabled: req.body.emailEnabled !== undefined ? req.body.emailEnabled : true,
          smsEnabled: req.body.smsEnabled !== undefined ? req.body.smsEnabled : false,
          pushEnabled: req.body.pushEnabled !== undefined ? req.body.pushEnabled : true,
        });
        sendSuccess(res, 'Preference created successfully', preference);
        return;
      }

      // Update existing preference
      const updatedPreference = await this.notificationPreferenceRepository.update(preference.id, {
        emailEnabled: req.body.emailEnabled,
        smsEnabled: req.body.smsEnabled,
        pushEnabled: req.body.pushEnabled,
      });

      sendSuccess(res, 'Preference updated successfully', updatedPreference);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to update preferences');
    }
  }

  /**
   * Create user notification preference
   * POST /api/v1/preferences
   */
  async createPreference(req: RequestWithId, res: Response): Promise<void> {
    try {
      const userId = req.body.userId;
      const notificationType = req.body.notificationType;

      if (!userId) {
        throw new AppError(400, 'userId is required');
      }

      if (!notificationType) {
        throw new AppError(400, 'notificationType is required');
      }

      // Check if preference already exists
      const existing = await this.notificationPreferenceRepository.findByUserAndType(
        userId,
        notificationType
      );

      if (existing) {
        throw new AppError(409, 'Preference already exists for this user and notification type');
      }

      const preference = await this.notificationPreferenceRepository.create({
        userId,
        notificationType,
        emailEnabled: req.body.emailEnabled !== undefined ? req.body.emailEnabled : true,
        smsEnabled: req.body.smsEnabled !== undefined ? req.body.smsEnabled : false,
        pushEnabled: req.body.pushEnabled !== undefined ? req.body.pushEnabled : true,
      });

      sendCreated(res, 'Preference created successfully', preference);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new AppError(409, 'Preference already exists for this user and notification type');
      }
      throw new AppError(500, error instanceof Error ? error.message : 'Failed to create preference');
    }
  }
}

