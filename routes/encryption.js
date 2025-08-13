// routes/encryption.js

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { setEncryptionKey, changeEncryptionKey, checkEncryptionKey, verifyEncryptionKey, resetEncryptionAccount } from '../controllers/encryptionController.js';

const router = express.Router();
    
router.get('/status', authMiddleware, checkEncryptionKey);
router.post('/set-key', authMiddleware, setEncryptionKey);
router.post('/change-key', authMiddleware, changeEncryptionKey);
router.post('/verify-key', authMiddleware, verifyEncryptionKey);

// --- ENSURE THIS LINE EXISTS ---
router.post('/reset-account', authMiddleware, resetEncryptionAccount);

export default router;
