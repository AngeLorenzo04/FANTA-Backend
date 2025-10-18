import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err);

  // Errori custom (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      errorResponse(err.message, err.code, err.details)
    );
  }

  // Errori validazione Zod
  if (err instanceof ZodError) {
    return res.status(422).json(
      errorResponse('Validation error', 'VALIDATION_ERROR', err.issues)
    );
  }

  // Errori Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json(
      errorResponse('Database error', 'DB_ERROR', err.message)
    );
  }

  // Errori JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      errorResponse('Invalid token', 'INVALID_TOKEN')
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      errorResponse('Token expired', 'TOKEN_EXPIRED')
    );
  }

  // Errore generico
  return res.status(500).json(
    errorResponse('Internal server error', 'INTERNAL_ERROR')
  );
};