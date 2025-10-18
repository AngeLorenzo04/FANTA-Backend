import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { successResponse } from '../../utils/response';
import { registerSchema, loginSchema, refreshSchema } from './auth.validation';

const authService = new AuthService();

export class AuthController {
  // POST /api/auth/register
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Valida input
      const validatedData = registerSchema.parse(req.body);

      // Chiama service
      const result = await authService.register(validatedData);

      // Risposta
      res.status(201).json(successResponse(result, 'User registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);
      res.status(200).json(successResponse(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const result = await authService.refresh(refreshToken);
      res.status(200).json(successResponse(result, 'Token refreshed'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user viene popolato dal middleware auth
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await authService.getCurrentUser(userId);
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/logout
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Per ora solo risposta (refresh token invalidation va implementato con Redis/DB)
      res.status(200).json(successResponse(null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }
}