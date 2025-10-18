import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { errorResponse } from '../utils/response';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse('Forbidden: Insufficient permissions', 'FORBIDDEN')
      );
    }

    next();
  };
};