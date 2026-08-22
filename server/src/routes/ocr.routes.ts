import { Router } from 'express';
import { processBusinessCard } from '../controllers/ocr.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Secure backend OCR gateway endpoint
router.post('/business-card', authMiddleware, processBusinessCard);

export default router;
