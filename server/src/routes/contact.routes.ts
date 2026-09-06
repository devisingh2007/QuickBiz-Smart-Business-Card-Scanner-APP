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
router.use(authMiddleware);

router.get('/', validateSearchParams, getContacts);
router.post('/', validateContactPayload, createContact);
router.get('/:id', getContactById);
router.patch('/:id', validateContactPayload, updateContact);
router.delete('/:id', deleteContact);

export default router;
