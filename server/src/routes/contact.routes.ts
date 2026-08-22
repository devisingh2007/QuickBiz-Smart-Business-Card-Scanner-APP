import { Router } from 'express';
import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
} from '../controllers/contact.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all contact routes
router.use(authMiddleware as any);

router.get('/', getContacts as any);
router.post('/', createContact as any);
router.get('/:id', getContactById as any);
router.patch('/:id', updateContact as any);
router.delete('/:id', deleteContact as any);

export default router;
