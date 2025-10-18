import { Router } from 'express';

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
    }
  });
});

// TODO: Import and use module routes
// import authRoutes from '../modules/auth/auth.routes';
// router.use('/auth', authRoutes);

export default router;