import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import sessionRoutes from '../modules/session/session.routes';
import eventsRoutes from '../modules/event/event.routes';
import predictionsRoutes from '../modules/predictions/predictions.routes';
import leaderboardRoutes from '../modules/leaderboard/leaderboard.routes';

const router = Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    message: 'Predictions Game API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      session: '/api/session',
      events: '/api/events',
      predictions: '/api/predictions',
      leaderboard: '/api/leaderboard',
    },
  });
});

// Module routes
router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/events', eventsRoutes);
router.use('/predictions', predictionsRoutes);
router.use('/leaderboard', leaderboardRoutes);

export default router;