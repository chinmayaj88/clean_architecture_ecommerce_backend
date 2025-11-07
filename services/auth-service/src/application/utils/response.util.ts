/**
 * Universal Response Utility
 * Provides standardized response structure for all services
 * 
 * All API responses follow this structure:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: T,
 *   timestamp?: string
 * }
 */

import { Response } from 'express';

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

/**
 * Error Response Structure (for consistency, but success is always false)
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  timestamp?: string;
}

/**
 * Success Response Helper
 * Creates a standardized success response
 * 
 * @param res Express Response object
 * @param statusCode HTTP status code (default: 200)
 * @param message Success message
 * @param data Optional data payload
 */
export function sendSuccess<T>(
  res: Response,
  statusCode: number = 200,
  message: string,
  data?: T
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

/**
 * Error Response Helper
 * Creates a standardized error response
 * 
 * @param res Express Response object
 * @param statusCode HTTP status code
 * @param message Error message
 * @param error Optional detailed error information
 */
export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  error?: string
): void {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(error && { error }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

/**
 * Created Response Helper (201 status)
 * Convenience method for resource creation
 */
export function sendCreated<T>(
  res: Response,
  message: string,
  data?: T
): void {
  sendSuccess(res, 201, message, data);
}

/**
 * No Content Response Helper (204 status)
 * For successful operations with no response body
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * Bad Request Response Helper (400 status)
 */
export function sendBadRequest(res: Response, message: string, error?: string): void {
  sendError(res, 400, message, error);
}

/**
 * Unauthorized Response Helper (401 status)
 */
export function sendUnauthorized(res: Response, message: string = 'Unauthorized', error?: string): void {
  sendError(res, 401, message, error);
}

/**
 * Forbidden Response Helper (403 status)
 */
export function sendForbidden(res: Response, message: string = 'Forbidden', error?: string): void {
  sendError(res, 403, message, error);
}

/**
 * Not Found Response Helper (404 status)
 */
export function sendNotFound(res: Response, message: string = 'Resource not found', error?: string): void {
  sendError(res, 404, message, error);
}

/**
 * Conflict Response Helper (409 status)
 */
export function sendConflict(res: Response, message: string, error?: string): void {
  sendError(res, 409, message, error);
}

/**
 * Internal Server Error Response Helper (500 status)
 */
export function sendInternalError(
  res: Response,
  message: string = 'Internal server error',
  error?: string
): void {
  sendError(res, 500, message, error);
}

/**
 * Validation Error Response Helper (422 status)
 */
export function sendValidationError(res: Response, message: string, errors?: Record<string, string[]>): void {
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  };

  res.status(422).json(response);
}

