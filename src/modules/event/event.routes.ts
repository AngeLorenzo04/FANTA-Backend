import { Router } from 'express';
import { EventsController } from './event.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/roles.middleware';

const router = Router();
const eventsController = new EventsController();

// Public routes
router.get('/', (req, res, next) => eventsController.getEvents(req, res, next));

// Admin only routes
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res, next) => eventsController.createEvent(req, res, next)
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res, next) => eventsController.updateEvent(req, res, next)
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res, next) => eventsController.deleteEvent(req, res, next)
);

router.patch(
  '/:id/verify',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res, next) => eventsController.verifyEvent(req, res, next)
);

router.patch(
  '/verify-batch',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res, next) => eventsController.verifyBatch(req, res, next)
);

router.patch(
  '/reorder',
  authMiddleware,
  requireRole('ADMIN'),
  (req, res, next) => eventsController.reorderEvents(req, res, next)
);

export default router;