import { Router } from 'express';
import { processBusinessCard, isOcrConfigured } from '../controllers/ocr.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Secure backend OCR gateway endpoint
router.post('/business-card', authMiddleware, processBusinessCard);

// OCR configurations status health endpoint
router.get('/health', (req, res) => {
  console.log('[OCR HEALTH] Request received');
  const configured = isOcrConfigured();
  console.log('[OCR HEALTH] Google Vision configuration checked');
  console.log(`[OCR HEALTH] Credentials configured: ${configured}`);
  
  const status = configured ? 200 : 503;
  console.log(`[OCR HEALTH] Response status: ${status}`);

  res.status(status).json({
    success: configured,
    provider: 'google-cloud-vision',
    configured,
    code: configured ? 'OCR_CONFIGURED' : 'OCR_CREDENTIALS_MISSING',
  });
});

export default router;
