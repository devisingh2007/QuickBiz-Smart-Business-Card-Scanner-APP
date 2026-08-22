import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import contactRoutes from './routes/contact.routes';

dotenv.config({ override: true });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the QuickBiz API Server', status: 'OK' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
