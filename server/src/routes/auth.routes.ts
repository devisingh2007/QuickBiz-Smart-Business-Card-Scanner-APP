import { Router } from 'express';
import { register, login, deleteAccount } from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.delete('/account', authMiddleware, deleteAccount);

export default router;
