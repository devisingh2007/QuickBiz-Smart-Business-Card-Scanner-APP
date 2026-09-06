import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const authPresent = !!(authHeader && authHeader.startsWith('Bearer '));
  console.log(`[AUTH] Request received: ${req.method} ${req.path}`);

  if (!authPresent) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  const token = authHeader!.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
    console.log('[AUTH] Token verified: true');
    next();
  } catch (error) {
    console.log('[AUTH] Token verified: false (invalid or expired)');
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};