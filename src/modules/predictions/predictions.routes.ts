import { Router } from 'express';
import { PredictionsController } from './predictions.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const predictionsController = new PredictionsController();

// Tutte le route richiedono autenticazione (USER o ADMIN)
router.use(authMiddleware);

// Get my predictions
router.get('/me', (req, res, next) => predictionsController.getMyPredictions(req, res, next));

// Save/update predictions (sovrascrive tutte)
router.post('/', (req, res, next) => predictionsController.savePredictions(req, res, next));

// Add single prediction
router.post('/:eventId', (req, res, next) => predictionsController.addPrediction(req, res, next));

// Remove single prediction
router.delete('/:eventId', (req, res, next) =>
  predictionsController.removePrediction(req, res, next)
);

// Get predictions stats
router.get('/stats', (req, res, next) => predictionsController.getStats(req, res, next));

// Check if user completed predictions
router.get('/completed', (req, res, next) => predictionsController.hasCompleted(req, res, next));

export default router;