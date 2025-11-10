import { Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { sendValidationError } from '../application/utils/response.util';
import { RequestWithId } from './requestId.middleware';

export const validateCreatePayment = [
  body('orderId').isString().notEmpty().withMessage('orderId is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount must be a positive number'),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('currency must be a 3-letter code'),
  body('paymentMethodId').optional().isString().withMessage('paymentMethodId must be a string'),
  body('description').optional().isString().withMessage('description must be a string'),
];

export const validateProcessPayment = [
  param('paymentId').isString().notEmpty().withMessage('paymentId is required'),
];

export const validateRefundPayment = [
  param('paymentId').isString().notEmpty().withMessage('paymentId is required'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('amount must be a positive number'),
  body('reason').optional().isString().withMessage('reason must be a string'),
];

export const validateGetPayments = [
  query('status').optional().isString().isIn(['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED']).withMessage('Invalid status'),
  query('paymentProvider').optional().isString().isIn(['STRIPE', 'PAYPAL', 'MOCK']).withMessage('Invalid payment provider'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
  query('sortBy').optional().isString().isIn(['createdAt', 'amount', 'status']).withMessage('Invalid sortBy'),
  query('sortOrder').optional().isString().isIn(['asc', 'desc']).withMessage('Invalid sortOrder'),
  query('startDate').optional().isISO8601().withMessage('Invalid startDate'),
  query('endDate').optional().isISO8601().withMessage('Invalid endDate'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('minAmount must be a positive number'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('maxAmount must be a positive number'),
];

export const validateCreatePaymentMethod = [
  body('type').isString().isIn(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL']).withMessage('Invalid payment method type'),
  body('provider').isString().isIn(['STRIPE', 'PAYPAL', 'MOCK']).withMessage('Invalid payment provider'),
  body('providerToken').optional().isString().withMessage('providerToken must be a string'),
  body('last4').optional().isString().isLength({ min: 4, max: 4 }).withMessage('last4 must be 4 digits'),
  body('cardType').optional().isString().withMessage('cardType must be a string'),
  body('expiryMonth').optional().isString().isLength({ min: 2, max: 2 }).withMessage('expiryMonth must be 2 digits'),
  body('expiryYear').optional().isString().isLength({ min: 4, max: 4 }).withMessage('expiryYear must be 4 digits'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
];

export const validateProcessWebhook = [
  body('provider').isString().isIn(['STRIPE', 'PAYPAL', 'MOCK']).withMessage('Invalid provider'),
  body('eventType').isString().notEmpty().withMessage('eventType is required'),
  body('providerEventId').isString().notEmpty().withMessage('providerEventId is required'),
  body('payload').isObject().withMessage('payload is required'),
];

export function handleValidationErrors(req: RequestWithId, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap: Record<string, string[]> = {};
    errors.array().forEach((error) => {
      const field = (error as any).param || (error as any).path;
      if (!errorMap[field]) {
        errorMap[field] = [];
      }
      errorMap[field].push(error.msg);
    });

    sendValidationError(res, 'Validation failed', errorMap);
    return;
  }
  next();
}

