import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  requestId?: string;
}

export function sendSuccess<T>(res: Response, message: string, data?: T, statusCode: number = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, message: string, data?: T): void {
  sendSuccess(res, message, data, 201);
}

export function sendError(res: Response, message: string, statusCode: number = 400, errors?: any[]): void {
  const response: ApiResponse = {
    success: false,
    message,
  };

  if (errors) {
    (response as any).errors = errors;
  }

  res.status(statusCode).json(response);
}

