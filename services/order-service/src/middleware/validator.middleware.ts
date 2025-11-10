import { Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { sendValidationError } from '../application/utils/response.util';
import { RequestWithId } from './requestId.middleware';

export const validateCreateOrder = [
  body('cartId').optional().isString().withMessage('cartId must be a string'),
  body('shippingAddressId').optional().isString().withMessage('shippingAddressId must be a string'),
  body('paymentMethodId').optional().isString().withMessage('paymentMethodId must be a string'),
  body('shippingMethod').optional().isString().withMessage('shippingMethod must be a string'),
];

export const validateUpdateOrderStatus = [
  param('orderId').isString().notEmpty().withMessage('orderId is required'),
  body('status').isString().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid status'),
  body('reason').optional().isString().withMessage('reason must be a string'),
];

export const validateUpdatePaymentStatus = [
  param('orderId').isString().notEmpty().withMessage('orderId is required'),
  body('paymentStatus').isString().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status'),
  body('reason').optional().isString().withMessage('reason must be a string'),
];

export const validateGetOrders = [
  query('status').optional().isString().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid status'),
  query('paymentStatus').optional().isString().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
  query('sortBy').optional().isString().isIn(['createdAt', 'totalAmount', 'status']).withMessage('Invalid sortBy'),
  query('sortOrder').optional().isString().isIn(['asc', 'desc']).withMessage('Invalid sortOrder'),
  query('startDate').optional().isISO8601().withMessage('Invalid startDate'),
  query('endDate').optional().isISO8601().withMessage('Invalid endDate'),
  query('minAmount').optional().isFloat({ min: 0 }).withMessage('minAmount must be a positive number'),
  query('maxAmount').optional().isFloat({ min: 0 }).withMessage('maxAmount must be a positive number'),
];

export const validateCancelOrder = [
  param('orderId').isString().notEmpty().withMessage('orderId is required'),
  body('reason').optional().isString().withMessage('reason must be a string'),
];

export const validateCreateOrderNote = [
  param('orderId').isString().notEmpty().withMessage('orderId is required'),
  body('note').isString().notEmpty().withMessage('note is required'),
  body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean'),
];

export const validateUpdateOrderNote = [
  param('noteId').isString().notEmpty().withMessage('noteId is required'),
  body('note').isString().notEmpty().withMessage('note is required'),
];

export function handleValidationErrors(req: RequestWithId, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap: Record<string, string[]> = {};
    errors.array().forEach((error: any) => {
      const field = error.path || error.param;
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

