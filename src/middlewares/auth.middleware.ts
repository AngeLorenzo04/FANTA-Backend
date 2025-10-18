import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ottieni token dall'header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('No token provided', 'NO_TOKEN'));
    }

    // Estrai token
    const token = authHeader.substring(7); // Rimuovi "Bearer "

    // Verifica token
    const payload = verifyAccessToken(token);

    // Aggiungi info utente alla request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse('Token expired', 'TOKEN_EXPIRED'));
    }

    return res.status(401).json(errorResponse('Invalid token', 'INVALID_TOKEN'));
  }
};