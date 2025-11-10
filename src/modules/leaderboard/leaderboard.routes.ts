import { Router } from 'express';
import { LeaderboardController } from './leaderboard.controller';

const router = Router();
const leaderboardController = new LeaderboardController();

// UNA SOLA ROUTE: Leaderboard completa (pubblica, no auth needed)
router.get('/', (req, res, next) => leaderboardController.getLeaderboard(req, res, next));

export default router;