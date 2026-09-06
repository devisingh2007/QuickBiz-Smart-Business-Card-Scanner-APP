import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Declaration merging so Express.Request natively has userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export type AuthenticatedRequest = Request;

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as { userId: string };
    if (!decoded || !decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
      return;
    }
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};
