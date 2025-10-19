import { Request, Response, NextFunction } from 'express';
import { SessionService } from './session.service';
import { successResponse } from '../../utils/response';
import { createSessionSchema, updateStateSchema } from './session.validation';

const sessionService = new SessionService();

export class SessionController {
  // GET /api/session/current
  async getCurrentSession(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await sessionService.getCurrentSession();
      res.status(200).json(successResponse(session));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/session/create
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createSessionSchema.parse(req.body);
      const adminId = req.user!.userId;

      const session = await sessionService.createSession(adminId, validatedData);
      res.status(201).json(successResponse(session, 'Session created successfully'));
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/session/state
  async updateState(req: Request, res: Response, next: NextFunction) {
    try {
      const { state } = updateStateSchema.parse(req.body);
      const session = await sessionService.updateSessionState(state);
      res.status(200).json(successResponse(session, 'Session state updated'));
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/session/reset
  async resetSession(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sessionService.resetSession();
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/session/stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await sessionService.getSessionStats();
      res.status(200).json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }
}
