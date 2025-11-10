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
}
