import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import sessionRoutes from '../modules/session/session.routes';
import eventsRoutes from '../modules/event/event.routes';

const router = Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    message: 'Predictions Game API',
    version: '1.0.0',
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

export default router;