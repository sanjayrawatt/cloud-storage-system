import express from 'express';
import { register, login, changePassword, forgotPassword, resetPassword } from '../controllers/auth.js';
import authMiddleware from '../middleware/auth.js'; // This line was missing

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route (requires a valid token)
router.post('/change-password', authMiddleware, changePassword);

router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);


export default router;
