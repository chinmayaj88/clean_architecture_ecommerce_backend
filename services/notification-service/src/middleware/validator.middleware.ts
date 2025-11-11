import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './errorHandler.middleware';

export const validateSendNotification = [
  body('userId')
    .isString()
    .notEmpty()
    .withMessage('userId is required and must be a string'),
  body('type')
    .isIn(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
    .withMessage('type must be one of: EMAIL, SMS, PUSH, IN_APP'),
  body('body')
    .isString()
    .notEmpty()
    .withMessage('body is required and must be a string'),
  body('subject')
    .optional()
    .isString()
    .withMessage('subject must be a string'),
  body('bodyHtml')
    .optional()
    .isString()
    .withMessage('bodyHtml must be a string'),
  body('bodyText')
    .optional()
    .isString()
    .withMessage('bodyText must be a string'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('metadata must be an object'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO 8601 date'),
  body('checkPreferences')
    .optional()
    .isBoolean()
    .withMessage('checkPreferences must be a boolean'),
  body('notificationType')
    .optional()
    .isString()
    .withMessage('notificationType must be a string'),
];

export const validateGetNotifications = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('userId is required and must be a string'),
  query('type')
    .optional()
    .isIn(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
    .withMessage('type must be one of: EMAIL, SMS, PUSH, IN_APP'),
  query('status')
    .optional()
    .isIn(['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'])
    .withMessage('status must be one of: PENDING, SENT, DELIVERED, FAILED, BOUNCED'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a non-negative integer'),
];

export const validateNotificationId = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('id is required and must be a string'),
];

export const validateCreateTemplate = [
  body('name')
    .isString()
    .notEmpty()
    .withMessage('name is required and must be a string'),
  body('subject')
    .isString()
    .notEmpty()
    .withMessage('subject is required and must be a string'),
  body('bodyHtml')
    .isString()
    .notEmpty()
    .withMessage('bodyHtml is required and must be a string'),
  body('bodyText')
    .optional()
    .isString()
    .withMessage('bodyText must be a string'),
  body('variables')
    .optional()
    .isObject()
    .withMessage('variables must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const validateUpdateTemplate = [
  body('name')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('name must be a non-empty string'),
  body('subject')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('subject must be a non-empty string'),
  body('bodyHtml')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('bodyHtml must be a non-empty string'),
  body('bodyText')
    .optional()
    .isString()
    .withMessage('bodyText must be a string'),
  body('variables')
    .optional()
    .isObject()
    .withMessage('variables must be an object'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const validateTemplateId = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('id is required and must be a string'),
];

export const validateGetPreferences = [
  query('userId')
    .isString()
    .notEmpty()
    .withMessage('userId query parameter is required and must be a string'),
];

export const validateCreatePreference = [
  body('userId')
    .isString()
    .notEmpty()
    .withMessage('userId is required and must be a string'),
  body('notificationType')
    .isString()
    .notEmpty()
    .withMessage('notificationType is required and must be a string'),
  body('emailEnabled')
    .optional()
    .isBoolean()
    .withMessage('emailEnabled must be a boolean'),
  body('smsEnabled')
    .optional()
    .isBoolean()
    .withMessage('smsEnabled must be a boolean'),
  body('pushEnabled')
    .optional()
    .isBoolean()
    .withMessage('pushEnabled must be a boolean'),
];

export const validateUpdatePreference = [
  body('userId')
    .isString()
    .notEmpty()
    .withMessage('userId is required and must be a string'),
  body('notificationType')
    .isString()
    .notEmpty()
    .withMessage('notificationType is required and must be a string'),
  body('emailEnabled')
    .optional()
    .isBoolean()
    .withMessage('emailEnabled must be a boolean'),
  body('smsEnabled')
    .optional()
    .isBoolean()
    .withMessage('smsEnabled must be a boolean'),
  body('pushEnabled')
    .optional()
    .isBoolean()
    .withMessage('pushEnabled must be a boolean'),
];

export const validatePreferenceParams = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('userId is required and must be a string'),
  param('notificationType')
    .isString()
    .notEmpty()
    .withMessage('notificationType is required and must be a string'),
];

export function handleValidationErrors(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw new AppError(400, `Validation failed: ${errorMessages}`);
  }
  next();
}

