import { Router } from 'express';
import { SessionController } from './session.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/roles.middleware';

const router = Router();
const sessionController = new SessionController();

// Public routes
router.get('/current', (req, res, next) => sessionController.getCurrentSession(req, res, next));
router.get('/stats', (req, res, next) => sessionController.getStats(req, res, next));

// Admin only routes
router.post(
  '/create',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res, next) => sessionController.createSession(req, res, next)
);

router.patch(
  '/state',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res, next) => sessionController.updateState(req, res, next)
);

router.delete(
  '/reset',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res, next) => sessionController.resetSession(req, res, next)
);

export default router;