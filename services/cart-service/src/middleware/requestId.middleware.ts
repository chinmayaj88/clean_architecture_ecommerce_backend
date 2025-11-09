import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Omit<Request, 'timedout'> {
  id?: string;
  timedout?: boolean;
}

export function requestIdMiddleware(req: RequestWithId, _res: Response, next: NextFunction): void {
  req.id = uuidv4();
  next();
}

