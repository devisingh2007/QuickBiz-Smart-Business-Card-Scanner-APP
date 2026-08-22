import { Router } from 'express';
import { processBusinessCard, isOcrConfigured } from '../controllers/ocr.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Secure backend OCR gateway endpoint
router.post('/business-card', authMiddleware, processBusinessCard);

// OCR configurations status health endpoint
router.get('/health', (req, res) => {
  const configured = isOcrConfigured();
  res.json({
    success: true,
    provider: 'google-cloud-vision',
    configured,
    code: configured ? 'OCR_CONFIGURED' : 'OCR_CREDENTIALS_MISSING',
  });
});

export default router;
