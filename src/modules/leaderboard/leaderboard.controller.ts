import { Request, Response, NextFunction } from 'express';
import { LeaderboardService } from './leaderboard.service';
import { successResponse } from '../../utils/response';

const leaderboardService = new LeaderboardService();

export class LeaderboardController {
  // GET /api/leaderboard
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const leaderboard = await leaderboardService.getLeaderboard();
      res.status(200).json(successResponse(leaderboard));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/leaderboard/me
  async getMyScore(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const score = await leaderboardService.getMyScore(userId);
      res.status(200).json(successResponse(score));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/leaderboard/stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await leaderboardService.getSessionStatistics();
      res.status(200).json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/leaderboard/podium
  async getPodium(req: Request, res: Response, next: NextFunction) {
    try {
      const podium = await leaderboardService.getPodium();
      res.status(200).json(successResponse(podium));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/leaderboard/compare/:userId
  async compareUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId1 = req.user!.userId;
      const { userId: userId2 } = req.params;
      const comparison = await leaderboardService.compareUsers(userId1, userId2);
      res.status(200).json(successResponse(comparison));
    } catch (error) {
      next(error);
    }
  }
}