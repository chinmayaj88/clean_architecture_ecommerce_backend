import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  timestamp?: string;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

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

export function sendCreated<T>(
  res: Response,
  message: string,
  data?: T
): void {
  sendSuccess(res, 201, message, data);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendBadRequest(res: Response, message: string, error?: string): void {
  sendError(res, 400, message, error);
}

export function sendUnauthorized(res: Response, message: string = 'Unauthorized', error?: string): void {
  sendError(res, 401, message, error);
}

export function sendForbidden(res: Response, message: string = 'Forbidden', error?: string): void {
  sendError(res, 403, message, error);
}

export function sendNotFound(res: Response, message: string = 'Resource not found', error?: string): void {
  sendError(res, 404, message, error);
}

export function sendConflict(res: Response, message: string, error?: string): void {
  sendError(res, 409, message, error);
}

export function sendInternalError(
  res: Response,
  message: string = 'Internal server error',
  error?: string
): void {
  sendError(res, 500, message, error);
}

export function sendValidationError(res: Response, message: string, errors?: Record<string, string[]>): void {
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  };

  res.status(422).json(response);
}

