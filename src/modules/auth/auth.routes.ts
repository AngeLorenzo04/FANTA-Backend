import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

// Protected routes (require authentication)
router.get('/me', authMiddleware, (req, res, next) => authController.me(req, res, next));
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));

export default router;