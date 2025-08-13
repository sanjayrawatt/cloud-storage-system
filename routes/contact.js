// routes/contact.js

import express from 'express';
import { handleContactForm } from '../controllers/contactController.js';

const router = express.Router();

// This will handle POST requests to /api/contact/
router.post('/', handleContactForm);

export default router;
