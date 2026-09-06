
import { Router } from 'express';
import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
} from '../controllers/contact.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateSearchParams, validateContactPayload } from '../middleware/validation.middleware';

const router = Router();

// Apply authentication middleware to all contact routes
router.use(authMiddleware as any);

router.get('/', validateSearchParams, getContacts as any);
router.post('/', validateContactPayload, createContact as any);
router.get('/:id', getContactById as any);
router.patch('/:id', validateContactPayload, updateContact as any);
router.delete('/:id', deleteContact as any);

export default router;