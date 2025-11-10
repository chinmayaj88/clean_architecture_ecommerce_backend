import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  id?: string;
}

export function requestIdMiddleware(req: Request & { id?: string }, res: Response, next: NextFunction): void {
  (req as RequestWithId).id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-Id', (req as RequestWithId).id!);
  next();
}

