import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide name, email and password' });
      return;
    }

    const result = await AuthService.register(name, email, password);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      ...result,
    });
  } catch (error: any) {
    const isDuplicate = error.message.includes('already exists');
    res.status(isDuplicate ? 400 : 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const result = await AuthService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    const isInvalid = error.message.includes('Invalid');
    res.status(isInvalid ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await AuthService.deleteAccount(userId);

    res.status(200).json({
      success: true,
      message: 'Account and all associated contacts deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};
