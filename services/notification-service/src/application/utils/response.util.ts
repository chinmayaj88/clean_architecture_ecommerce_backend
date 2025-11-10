import { Response } from 'express';

export function sendSuccess(res: Response, message: string, data?: any): void {
  res.json({
    success: true,
    message,
    data,
  });
}

export function sendCreated(res: Response, message: string, data?: any): void {
  res.status(201).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res: Response, statusCode: number, message: string, details?: any): void {
  res.status(statusCode).json({
    success: false,
    message,
    details,
  });
}

export function sendNotFound(res: Response, message: string): void {
  res.status(404).json({
    success: false,
    message,
  });
}

export function sendInternalError(res: Response, message: string, details?: any): void {
  res.status(500).json({
    success: false,
    message,
    details,
  });
}



