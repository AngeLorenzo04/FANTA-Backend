import { Router } from 'express';
import { LeaderboardController } from './leaderboard.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const leaderboardController = new LeaderboardController();

// Tutte le route richiedono autenticazione
router.use(authMiddleware);

// Leaderboard completa
router.get('/', (req, res, next) => leaderboardController.getLeaderboard(req, res, next));

// Il mio punteggio dettagliato
router.get('/me', (req, res, next) => leaderboardController.getMyScore(req, res, next));

// Statistiche sessione
router.get('/stats', (req, res, next) => leaderboardController.getStats(req, res, next));

// Podio (top 3)
router.get('/podium', (req, res, next) => leaderboardController.getPodium(req, res, next));

// Confronta con altro user
router.get('/compare/:userId', (req, res, next) =>
  leaderboardController.compareUsers(req, res, next)
);

export default router;
