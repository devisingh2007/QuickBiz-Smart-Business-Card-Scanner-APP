import mongoose from 'mongoose';

/**
 * Connect to MongoDB with sensible timeouts and environment validation.
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // In development mode only, provide a clear local fallback if no URI was configured
    if (process.env.NODE_ENV !== 'production') {
      const localUri = 'mongodb://127.0.0.1:27017/quickbiz';
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 10000 });
      return;
    }
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
};

/**
 * Disconnect from MongoDB cleanly (useful for test teardown and graceful shutdown).
 */
export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

/**
 * Check if MongoDB connection is active and ready.
 */
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export default connectDB;
