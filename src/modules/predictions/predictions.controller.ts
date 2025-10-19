import { Request, Response, NextFunction } from 'express';
import { PredictionsService } from './predictions.service';
import { successResponse } from '../../utils/response';
import { createPredictionsSchema } from './predictions.validation';

const predictionsService = new PredictionsService();

export class PredictionsController {
  // GET /api/predictions/me
  async getMyPredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const predictions = await predictionsService.getMyPredictions(userId);
      res.status(200).json(successResponse(predictions));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/predictions
  async savePredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const validatedData = createPredictionsSchema.parse(req.body);
      const result = await predictionsService.savePredictions(userId, validatedData);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/predictions/:eventId
  async removePrediction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { eventId } = req.params;
      const result = await predictionsService.removePrediction(userId, eventId);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/predictions/:eventId
  async addPrediction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { eventId } = req.params;
      const result = await predictionsService.addPrediction(userId, eventId);
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/predictions/stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await predictionsService.getPredictionsStats();
      res.status(200).json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/predictions/completed
  async hasCompleted(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const completed = await predictionsService.hasCompletedPredictions(userId);
      res.status(200).json(successResponse({ completed }));
    } catch (error) {
      next(error);
    }
  }
}