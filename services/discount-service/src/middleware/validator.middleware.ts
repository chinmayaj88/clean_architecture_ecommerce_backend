import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AppError } from './errorHandler.middleware';

export const validateCreateCoupon = [
  body('code')
    .isString()
    .notEmpty()
    .withMessage('code is required and must be a string'),
  body('name')
    .isString()
    .notEmpty()
    .withMessage('name is required and must be a string'),
  body('type')
    .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
    .withMessage('type must be one of: PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING'),
  body('discountValue')
    .isNumeric()
    .withMessage('discountValue is required and must be a number'),
  body('minimumAmount')
    .optional()
    .isNumeric()
    .withMessage('minimumAmount must be a number'),
  body('maximumDiscount')
    .optional()
    .isNumeric()
    .withMessage('maximumDiscount must be a number'),
  body('currency')
    .optional()
    .isString()
    .withMessage('currency must be a string'),
  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('usageLimit must be a positive integer'),
  body('usageLimitPerUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('usageLimitPerUser must be a positive integer'),
  body('startsAt')
    .optional()
    .isISO8601()
    .withMessage('startsAt must be a valid ISO 8601 date'),
  body('endsAt')
    .optional()
    .isISO8601()
    .withMessage('endsAt must be a valid ISO 8601 date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const validateUpdateCoupon = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('id is required and must be a string'),
  body('name')
    .optional()
    .isString()
    .withMessage('name must be a string'),
  body('type')
    .optional()
    .isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'])
    .withMessage('type must be one of: PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING'),
  body('discountValue')
    .optional()
    .isNumeric()
    .withMessage('discountValue must be a number'),
];

export const validateCouponId = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('id is required and must be a string'),
];

export const validateCouponCode = [
  param('code')
    .isString()
    .notEmpty()
    .withMessage('code is required and must be a string'),
];

export const validateCreatePromotion = [
  body('name')
    .isString()
    .notEmpty()
    .withMessage('name is required and must be a string'),
  body('type')
    .isIn(['BUY_X_GET_Y', 'BUNDLE', 'VOLUME_DISCOUNT'])
    .withMessage('type must be one of: BUY_X_GET_Y, BUNDLE, VOLUME_DISCOUNT'),
  body('configuration')
    .isObject()
    .withMessage('configuration is required and must be an object'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED'])
    .withMessage('status must be one of: DRAFT, ACTIVE, PAUSED, EXPIRED'),
];

export const validatePromotionId = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('id is required and must be a string'),
];

export const validatePromotionRule = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('promotion id is required and must be a string'),
  body('ruleType')
    .isString()
    .notEmpty()
    .withMessage('ruleType is required and must be a string'),
  body('conditions')
    .isObject()
    .withMessage('conditions is required and must be an object'),
  body('actions')
    .isObject()
    .withMessage('actions is required and must be an object'),
];

export const validatePromotionRuleId = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('promotion id is required and must be a string'),
  param('ruleId')
    .isString()
    .notEmpty()
    .withMessage('ruleId is required and must be a string'),
];

export const validateValidateCoupon = [
  body('code')
    .isString()
    .notEmpty()
    .withMessage('code is required and must be a string'),
  body('orderAmount')
    .isNumeric()
    .withMessage('orderAmount is required and must be a number'),
  body('userId')
    .optional()
    .isString()
    .withMessage('userId must be a string'),
];

export const validateCalculateDiscount = [
  body('coupon')
    .isObject()
    .withMessage('coupon is required and must be an object'),
  body('orderAmount')
    .isNumeric()
    .withMessage('orderAmount is required and must be a number'),
];

export const validateApplyCoupon = [
  body('code')
    .isString()
    .notEmpty()
    .withMessage('code is required and must be a string'),
  body('orderAmount')
    .isNumeric()
    .withMessage('orderAmount is required and must be a number'),
];

export const validateEvaluatePromotions = [
  body('cartItems')
    .optional()
    .isArray()
    .withMessage('cartItems must be an array'),
  body('cartTotal')
    .isNumeric()
    .withMessage('cartTotal is required and must be a number'),
];

export function handleValidationErrors(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw new AppError(400, `Validation failed: ${errorMessages}`);
  }
  next();
}

