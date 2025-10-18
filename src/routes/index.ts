import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';

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

// Auth routes
router.use('/auth', authRoutes);

export default router;