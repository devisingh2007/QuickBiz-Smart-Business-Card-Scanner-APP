import 'dotenv/config';
import dns from 'dns';
import app from './app';
import { connectDB } from './config/database';

// Fail-fast check for critical environment variables before starting
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI environment variable is not set.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

// In development, prioritize IPv4 and use public DNS fallback for MongoDB Atlas SRV lookups
if (process.env.NODE_ENV !== 'production') {
  dns.setDefaultResultOrder('ipv4first');
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {
    // Some platforms don't allow overriding DNS — ignore and continue.
  }
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
