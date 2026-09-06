import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import contactRoutes from './routes/contact.routes';

// Fail fast if the JWT secret is missing — never start without it.
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS — open in development, restricted to CORS_ORIGIN in production
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : [];

    // Mobile apps send no Origin header, so allow empty-origin requests always.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// 3. Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 4. Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Root and health check endpoints
const healthHandler = (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'QuickBiz API is healthy' });
};

const rootHandler = (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to the QuickBiz API Server', status: 'OK' });
};

app.get('/', rootHandler);
app.get('/api', rootHandler);
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// 6. Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contacts', contactLimiter, contactRoutes);

// 7. Global error handler
// In production, we hide the internal error message from the client.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';
  res.status(500).json({ success: false, message });
});

export default app;
